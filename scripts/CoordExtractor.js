let tag = "extractCoord";
let scriptName = "Coord Extractor";

function main() {
  if ($(`#${tag}_popup_container`).length) {
    UI.ErrorMessage("Script has already been loaded, reload the page before calling it again");
    return;
  }
  setHTML();
}

function setHTML() {
  console.log("teste");

  let html = `<div id="${tag}_popup_container" class="${tag}_popup_container">
  <div class="popup_content" id="${tag}_popup_contentContainer">
    <a class="popup_box_close tooltip-delayed" id="${tag}_popup_cross" href="javascript:void(0)"></a>
    <div id="${tag}_popup_content">
      <h3 class="centered">${scriptName}</h3>
      <textarea id="${tag}_coordsText" placeholder="Paste text with coordinates here..." rows="4"></textarea>
      <div class="options">
        <div class="checkbox-group">
          <label>
            <input type="checkbox" id="${tag}_breakLines" name="${tag}_breakLines">
            Break Lines
          </label>
          <label>
            <input type="checkbox" id="${tag}_removeDuplicates" name="${tag}_removeDuplicates">
            Remove Duplicates
          </label>
        </div>
        <div class="delimiter-group">
          <label for="${tag}_delimiter">Delimiter</label>
          <input type="text" id="${tag}_delimiter" name="${tag}_delimiter" maxlength="100" value=" ">
        </div>
      </div>
      <p><input class="btn" id="${tag}_extract" type="submit" value="Extract"></p>
    </div>
  </div>
</div>
<style>

.${tag}_popup_container {
  display: inline-block;
  border: 30px solid #804000;
  border-image: url("/graphic/popup/border.png") 19 repeat;
  position: fixed;
  top: 8%;
  left: 70%;
  z-index: 14000;
}

.popup_content {
    background-image: url('/graphic/popup/content_background.png');
  }

#${tag}_popup_content textarea {
  width: 100%;
  min-width: 250px;
  min-height: 50px;
  resize: both;
  overflow: auto;
}

#${tag}_popup_content p,h3 {
    text-align: center;
}

.options {
  display: flex;
  justify-content: space-around;
  align-items: baseline;
  flex-direction:row;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ccc;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.delimiter-group {
  display: flex;
  position: relative;
  flex-direction: column;
  text-align:center;
  top: -7px;
}

.delimiter-group label {
    padding-bottom:5px;
  }

input[type="text"] {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  width: 100px;
}

</style>`;

  $("body").append(html);
  $(`#${tag}_popup_container`).draggable();
  $(`#${tag}_popup_cross`).click(closePopup);
  $(`#${tag}_popup_container`).find("textarea").click(focusSelect);
  $(`#${tag}_extract`).click(initiateCoordExtracting);
}

function closePopup() {
  $(`#${scriptTag}_popup_container`).remove();
}

function focusSelect() {
  this.focus();
  this.select();
}

function initiateCoordExtracting() {
  const regexPattern = /\d{3}\|\d{3}/g;
  const canExcludeDuplicates = document.getElementById(`${tag}_removeDuplicates`).checked;
  const canEnableLineBreaks = document.getElementById(`${tag}_breakLines`).checked;
  const delimiter = document.getElementById(`${tag}_delimiter`).value;
  const textArea = document.getElementById(`${tag}_coordsText`);
  const coords = extractCoordinates(textArea.value, regexPattern, canExcludeDuplicates, canEnableLineBreaks, delimiter);

  textArea.value = coords || "No coords found";
  textArea.select();
}

function extractCoordinates(text, regexPattern, canExcludeDuplicates, canEnableLineBreaks, delimiter) {
  let matches = [...text.matchAll(regexPattern)].map((m) => m[0]);
  matches = canExcludeDuplicates ? [...new Set(matches)] : matches;
  const finalDelimiter = canEnableLineBreaks ? `${delimiter}\n` : delimiter;
  return matches.join(finalDelimiter);
}

main();
