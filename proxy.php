<?php
$id = $_GET['id'];
$oclcurl = 'http://www.worldcat.org/webservices/catalog/content/libraries/';
$oclcurl .= $id;
$oclcurl .= "?startLibrary=2&format=json&wskey=[your key here]"; // go to http://www.oclc.org/developer/develop/web-services/worldcat-search-api.en.html and follow instructions for a Sandbox and Producation API Key

$response = file_get_contents($oclcurl);
echo $response
?>