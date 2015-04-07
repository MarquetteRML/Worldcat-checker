$.indexedDB("OCLClookup_db", {
	"schema" : {
		'1': function(vT){
			var item = vT.createObjectStore('item', {
				'keyPath': 'OCLCNumber'
			});
			item.createIndex('CallNumber');

			var count = vT.createObjectStore('count', {
				'keyPath': 'OCLCNumber'
			});
		}
	}
});

var globalData,
	finResults = [];

$(function(){
	$('#selectNames, #loading, #download').hide();
	$('#csvform').submit(function(e){
		e.preventDefault();
		$('#oclcName, #callName').empty();
		var list = $('#csvList').val();
		var titles = $.csv.toArrays(list);
		titles = titles[0];
		var data = $.csv.toObjects(list);
		globalData = data;
		$.each(titles, function(key, value) {   
			 $('#oclcName, #callName')
				 .append($("<option></option>")
				 .attr("value",value)
				 .text(value)); 
		});
		$('#selectNames').show();
	});
		
		$('#selectNames').submit(function(e){
			e.preventDefault();
			var oclcName = $('#oclcName').val();
			var callName = $('#callName').val();
			oclcLoop(oclcName, callName, globalData);
		});
});

$('#clearData').click(function(e){
	e.preventDefault();
	emptyDB();
});

$('#showResults').click(function(e){
	e.preventDefault();
	showResults();
});

function emptyDB(){
	$.indexedDB("OCLClookup_db").objectStore('item').clear();
	$.indexedDB("OCLClookup_db").objectStore('count').clear();
	alert('Cleared old Data');
}

function oclcLoop(oclcName, callName, data){
	$('#loading').show();
	$('#load-total').text(data.length);
	$('#load-at').text('0');
	
	$.each(data, function(i, v) {
		var callURL = './proxy.php?id=' + v[oclcName];
			$.getJSON(callURL, function(urlD){
				if(typeof urlD['diagnostic'] == "undefined"){
					var city = 0,
						state = 0,
						country = 0,
						total = urlD.library.length,
						item, 
						count;
					
					for (j=0; j < urlD.library.length; j++){
						if (urlD.library[j].oclcSymbol != "GZQ"){
							if(urlD.library[j].city == "Milwaukee"){
								city++;
							}
							
							if(urlD.library[j].state == "WI"){
								state++;
							}
							
							if(urlD.library[j].country == "United States"){
								country++;
							}
						}
					}


					item = {
							'CallNumber': data[i][callName],
							'OCLCNumber': urlD['OCLCnumber'],
							'Title': urlD['title'],
							'Author': urlD['author'],
							'Date': urlD['date']
						},

					count = {
							'OCLCNumber': urlD['OCLCnumber'],
							'City Count': city,
							'State Count': state,
							'Country Count': country,
							'Total Count': total
						};

					$.indexedDB("OCLClookup_db").objectStore("item").add(item).then(function(){
						$.indexedDB("OCLClookup_db").objectStore("count").add(count).then(function(){
							$('#load-at').delay(500*i).text(i + 1);
						});
					});
					
					
				}
			});
	});
	showResults();
}

function showResults() {
	$.indexedDB("OCLClookup_db").objectStore('item').index('CallNumber').each(function(elem){
		var newobj = (elem.value);
		var tempdate =  newobj.Date;
    	   	tempdate = tempdate.replace(/\D/g,'');
    		newobj.Date = tempdate;
			finResults.push(newobj);
     }).done(function(){
     	getCounts();
     });
}

function getCounts(){
	$.each(finResults, function(i,v){
	    $.indexedDB("OCLClookup_db").objectStore('count').get(finResults[i].OCLCNumber).done(function(counts){
		       finResults[i].city = counts['City Count'];
		       finResults[i].state = counts['State Count'];
		       finResults[i].country = counts['Country Count'];
		       finResults[i].total = counts['Total Count'];
	    }).done(function(){
	    	if(finResults.length - 1 == i) {
		     	var jsonObject = JSON.stringify(finResults);
		     	var csvObj = ConvertToCSV(jsonObject);
				$('#download')
			 		.attr('href', 'data:application/csv;charset=utf-8,"Call%20Number","OCLC%20Number","Title","Publisher","Year","City%20Count","State%20Count","Closest%20US%20Count","Total%20Libraries%20Searched",%0D%0A' + encodeURIComponent(csvObj))
			 		.attr('download', 'download.csv')
			 		.show();
	    	}

	    });
	});
}

function CSVSafeString(rawString){
	var innerValue = rawString===null?'':rawString.toString();
	var result = innerValue.replace(/"/g, '""');
	if (result.search(/("|,|\n)/g) >= 0)
	    result = '"' + result + '"';
	return result;
}

function ConvertToCSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';

    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
            if (line != '') line += ',';

            line += CSVSafeString(array[i][index]);
        }
    	str += line + '\r\n';
    }
    return str;
}