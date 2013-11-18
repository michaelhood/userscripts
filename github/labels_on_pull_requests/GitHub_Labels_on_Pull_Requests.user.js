// ==UserScript==
// @name        GitHub Labels on Pull Requests
// @namespace   https://github.com/iguananaut/userscripts
// @description Adds label management to GitHub pull request pages just like normal issues
// @include     http*://github.com/*/*/pull/*
// @version     1
// @downloadURL https://raw.github.com/iguananaut/userscripts/master/github/labels_on_pull_requests/GitHub_Labels_on_Pull_Requests.user.js
// @grant       GM_xmlhttpRequest
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js
// @require     http://builds.handlebarsjs.com.s3.amazonaws.com/handlebars.runtime-v1.1.2.js
// @require     https://raw.github.com/iguananaut/userscripts/master/github/labels_on_pull_requests/label_manager.handlebars.js
// ==/UserScript==

var ghDiscussionLabelsTemplate = Handlebars.templates.label_manager;

var ghUrlParts = document.URL.match("^https://github.com/([a-zA-Z0-9_-]+)/([a-zA-Z0-9_-]+)/pull/([0-9]+)");
var ghRepoUser = ghUrlParts[1];
var ghRepoName = ghUrlParts[2];
var ghPRNumber = ghUrlParts[3];


var ghCSRFToken = $("meta[name=csrf-token]").attr("content");

var ghRepoUrlBase = "https://api.github.com/repos/" + ghRepoUser + "/" + ghRepoName;
var ghIssuePostUrl = "/" + ghRepoUser + "/" + ghRepoName + "/issues/labels/modify_assignment";

var ghRepoLabels;
var ghIssueLabels;

// TODO: Make this less bad...
function ghAppendDiscussionLabels() {
  if (ghRepoLabels === undefined || ghIssueLabels == undefined) {
    return;
  }
  
  var context = {labels: ghRepoLabels, issueLabels: ghIssueLabels, dataUrl: ghIssuePostUrl,
               issue: ghPRNumber, csrf_token: ghCSRFToken};

  Handlebars.registerHelper('ifLabelSelected', function(label, block) {
    if (ghIssueLabels[label]) {
      return block.fn(this);
    } else {
      return block.inverse(this);
    }
  });

  $("div.discussion-sidebar").append("<hr></hr>").append(ghDiscussionLabelsTemplate(context));
}

GM_xmlhttpRequest({
  method: "GET",
  url: ghRepoUrlBase + "/labels",
  headers: {"Accept": "application/json"},
  onload: function(response) {
    // TODO: Error handling
    ghRepoLabels = JSON.parse(response.responseText);
    ghAppendDiscussionLabels();
  }
});

GM_xmlhttpRequest({
  method: "GET",
  url: ghRepoUrlBase + "/issues/" + ghPRNumber + "/labels",
  headers: {"Accept": "text/json"},
  onload: function(response) {
    // TODO: Error handling
    ghIssueLabels = JSON.parse(response.responseText);
    ghAppendDiscussionLabels();
  }
});
