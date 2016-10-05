/*
 *  TODO: give custom.js its own namespace so it can't modify variables used outside
 *  Only outside function/variable it should be able to access right now is linkouts.addLinkout and the inputs of each custom function (label text or index)
 */

linkouts.addLinkout("Search Google", "Samples", linkouts.MULTI_SELECT, searchGoogle);

linkouts.addLinkout("Search Google", "Genes", linkouts.MULTI_SELECT, searchGoogle);
linkouts.addLinkout("Search GeneCards", "Genes", linkouts.MULTI_SELECT, searchGeneCards);
linkouts.addLinkout("Search PubMed for All", "Genes", linkouts.MULTI_SELECT, searchPubMedForAll);
linkouts.addLinkout("Search PubMed for Any", "Genes", linkouts.MULTI_SELECT,searchPubMedForAny);
linkouts.addLinkout("This is my favorite gene", "Genes", linkouts.SINGLE_SELECT, favoriteGene,["dataset"]);

function searchGoogle(selection, axis){
	window.open('https://www.google.com/#q=' + selection.join("+"));
}

function searchGeneCards(labels){
	window.open('http://www.genecards.org/Search/Keyword?queryString=' + labels.join('+'));
}

function searchPubMedForAll(labels){
	window.open("http://www.ncbi.nlm.nih.gov/pubmed/?term=" + labels.join('+AND+'));
}

function searchPubMedForAny(labels){
	window.open("http://www.ncbi.nlm.nih.gov/pubmed/?term=" + labels.join('+OR+'));
}

function favoriteGene(label){
	var set = linkouts.getAttribute("dataset");
	alert(label +" is my favorite " + set + " gene");
}
