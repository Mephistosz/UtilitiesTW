$(document).ready(function () {
  main();
});

function main() {
  const tag = "extractCoord";
  const scriptName = "Coord Extractor";

  if (isScriptAlreadyLoaded(tag)) {
    UI.ErrorMessage("Script has already been loaded, reload the page before calling it again");
    return;
  }

  renderHTML(tag, scriptName);
}

function isScriptAlreadyLoaded(tag) {
  return $(`#${tag}_popup_container`).length > 0;
}

function renderHTML(tag, scriptName) {
  const html = generatePopupHTML(tag, scriptName);
  const style = generatePopupStyles(tag);

  $("body").append(html);
  $("head").append(`<style>${style}</style>`);

  const $popupContainer = $(`#${tag}_popup_container`);
  $popupContainer.draggable();
  $(`#${tag}_popup_cross`).click(() => closePopup(tag));
  $(`#${tag}_extract`).click(() => initiateCoordExtracting(tag));
}

function generatePopupHTML(tag, scriptName) {
  return `
    <div id="${tag}_popup_container" class="${tag}_popup_container">
      <div class="popup_content" id="${tag}_popup_contentContainer">
        <a class="popup_box_close tooltip-delayed" id="${tag}_popup_cross" href="javascript:void(0)"></a>
        <div id="${tag}_popup_content">
          <h3>${scriptName}</h3>
          <textarea id="${tag}_coordsText" placeholder="Paste text with coordinates here..." rows="4"></textarea>
          <div id="coordCounter" class="counter">0 coordinates extracted</div>
          <div class="options">
            <div class="checkbox-group">
              <label>
                <input type="checkbox" id="${tag}_breakLines" name="${tag}_breakLines"> Break Lines
              </label>
              <label>
                <input type="checkbox" id="${tag}_removeDuplicates" name="${tag}_removeDuplicates"> Remove Duplicates
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
    </div>`;
}

function generatePopupStyles(tag) {
  return `
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
      min-width: 250px;
      min-height: 50px;
      resize: both;
      overflow: auto;
    }
    #${tag}_popup_content p, #${tag}_popup_content h3 {
      text-align: center;
    }
    .counter {
      text-align: center;
      margin-top: 10px;
      font-weight: bold;
    }
    .options {
      display: flex;
      justify-content: space-around;
      align-items: baseline;
      flex-direction: row;
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
      text-align: center;
      top: -7px;
    }
    .delimiter-group label {
      padding-bottom: 5px;
    }
    .delimiter-group input[type="text"] {
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
      width: 100px;
    }`;
}

function closePopup(tag) {
  $(`#${tag}_popup_container`).remove();
}

function initiateCoordExtracting(tag) {
  const regexPattern = /\d{3}\|\d{3}/g;
  const canExcludeDuplicates = $(`#${tag}_removeDuplicates`).is(":checked");
  const canEnableLineBreaks = $(`#${tag}_breakLines`).is(":checked");
  const delimiter = $(`#${tag}_delimiter`).val();
  const $textArea = $(`#${tag}_coordsText`);
  const coords = extractCoordinates($textArea.val(), regexPattern, canExcludeDuplicates, canEnableLineBreaks, delimiter);

  $textArea
    .val(coords || "No coords found")
    .select()
    .focus();
  updateCounter(coords, regexPattern);
}

function extractCoordinates(text, regexPattern, canExcludeDuplicates, canEnableLineBreaks, delimiter) {
  let matches = Array.from(text.matchAll(regexPattern), (m) => m[0]);
  if (canExcludeDuplicates) {
    matches = [...new Set(matches)];
  }
  const finalDelimiter = canEnableLineBreaks ? `${delimiter}\n` : delimiter;
  return matches.join(finalDelimiter);
}

function updateCounter(coords, regexPattern) {
  const matches = Array.from(coords.matchAll(regexPattern), (m) => m[0]);
  $("#coordCounter").text(`${matches.length} coordinates extracted`);
}
