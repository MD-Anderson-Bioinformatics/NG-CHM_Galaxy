/*
 *  TO DO: give custom.js its own namespace so it can't modify variables used outside
 *  Only outside function/variable it should be able to access right now is addLinkout and the inputs of each custom function (label text or index)
 */

addLinkout("Search Google", "Samples", linkouts.MULTI_SELECT, linkouts.VISIBLE_LABELS, searchGoogle);

addLinkout("Search Google", "Genes", linkouts.MULTI_SELECT, linkouts.VISIBLE_LABELS, searchGoogle);
addLinkout("Search GeneCards", "Genes", linkouts.MULTI_SELECT, linkouts.VISIBLE_LABELS, searchGeneCards);
addLinkout("Search PubMed for All", "Genes", linkouts.MULTI_SELECT, linkouts.VISIBLE_LABELS, searchPubMedForAll);
addLinkout("Search PubMed for Any", "Genes", linkouts.MULTI_SELECT, linkouts.VISIBLE_LABELS, searchPubMedForAny);
addLinkout("This is my favorite gene", "Genes", linkouts.SINGLE_SELECT, linkouts.FULL_LABELS, favoriteGene,["dataset"]);

function searchGoogle(selection, axis){
	window.open('https://www.google.com/#q=' + selection.join("+"));
}

function searchGeneCards(labels){
	var searchTerm = '';
	for (var i = 0; i < labels.length; i++){
		searchTerm += "+" + labels[i];
	}
	searchTerm = searchTerm.substring(1);
	window.open('http://www.genecards.org/Search/Keyword?queryString=' + searchTerm);
}

function searchPubMedForAll(labels){
	var searchTerm = '';
	for (var i = 0; i < labels.length; i++){
		searchTerm += "+AND+" + labels[i];
	}
	searchTerm = searchTerm.substring(5);
	window.open("http://www.ncbi.nlm.nih.gov/pubmed/?term=" + searchTerm)
}

function searchPubMedForAny(labels){
	var searchTerm = '';
	for (var i = 0; i < labels.length; i++){
		searchTerm += "+OR+" + labels[i];
	}
	searchTerm = searchTerm.substring(4);
	window.open("http://www.ncbi.nlm.nih.gov/pubmed/?term=" + searchTerm)
}

function favoriteGene(label){
	alert(label +" is my favorite gene");
}