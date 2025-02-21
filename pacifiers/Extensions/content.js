(function () {
    try {
        function getYouTubeComments() {
            let comments = [];
            let commentElements = document.querySelectorAll("#content #content-text");

            commentElements.forEach(comment => {
                let text = comment.innerText.trim();
                if (text.length > 0) {
                    comments.push(text);
                }
            });

            return comments.length > 0 ? comments.join("\n\n") : "No comments found.";
        }

        let videoTitle = document.title.replace(" - YouTube", "");
        let videoURL = window.location.href;
        let commentsText = getYouTubeComments();

        let scrapedData = {
            title: videoTitle,
            url: videoURL,
            comments: commentsText
        };

        // Send data to popup.js
        chrome.runtime.sendMessage({ action: "scrapedData", data: scrapedData });

    } catch (error) {
        console.error("Error extracting YouTube comments:", error);
    }
})();
