$(document).ready(init);

function init() {
  const tag = "VillageCoordManager";
  const scriptName = "Village Coordinates Manager";

  if (isScriptAlreadyLoaded(tag)) {
    UI.ErrorMessage("Script has already been loaded. Reload the page before calling it again.");
    return;
  }

  renderPopup(tag, scriptName);
}

function isScriptAlreadyLoaded(tag) {
  return $(`#${tag}_popup_container`).length > 0;
}

function renderPopup(tag, scriptName) {
  const html = generatePopupHTML(tag, scriptName);
  const style = generatePopupStyles(tag);

  $("body").append(html);
  $("head").append(`<style>${style}</style>`);

  const $popupContainer = $(`#${tag}_popup_container`).draggable();

  $(`#${tag}_popup_cross`).click(() => closePopup(tag));
  $(`#${tag}_coordsText`).on("change", () => handleCoordinatesChange(tag));
  $(`#${tag}_claim`).click(() => claimCoordinates(tag));
  $(`#${tag}_release`).click(() => releaseCoordinates(tag));
}

function generatePopupHTML(tag, scriptName) {
  return `
    <div id="${tag}_popup_container" class="${tag}_popup_container">
      <div class="popup_content" id="${tag}_popup_contentContainer">
        <a class="popup_box_close tooltip-delayed" id="${tag}_popup_cross" href="javascript:void(0)"></a>
        <div id="${tag}_popup_content">
          <h3>${scriptName}</h3>
          <textarea id="${tag}_coordsText" placeholder="Enter coordinates here..." rows="4"></textarea>
          <div id="coordCounter" class="counter">0 coordinates selected</div>
          <div class="button-container">
            <input class="btn" id="${tag}_claim" type="button" value="Claim">
            <input class="btn" id="${tag}_release" type="button" value="Release">
          </div>
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
      min-width: 265px;
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
    .button-container {
      display: flex;
      gap: 10px;
      justify-content: center;
    }
    .button-container button {
      flex: 1;
    }
  `;
}

function closePopup(tag) {
  $(`#${tag}_popup_container`).remove();
}

function handleCoordinatesChange(tag) {
  const regexPattern = /\d{3}\|\d{3}/g;
  const delimiter = " ";
  const $textArea = $(`#${tag}_coordsText`);
  const coords = extractCoordinates($textArea.val(), regexPattern);

  $textArea.val(coords.join(delimiter) || "No coords found");
  updateCoordCounter(coords);
}

function extractCoordinates(text, regexPattern) {
  const matches = Array.from(text.matchAll(regexPattern), (m) => m[0]);
  return [...new Set(matches)];
}

function updateCoordCounter(coords) {
  $("#coordCounter").text(`${coords.length} coordinates selected`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTribalWarsData(villageSourceId, coordInput, requestId, responses) {
  const url = `https://br127.tribalwars.com.br/game.php?village=${villageSourceId}&screen=api&ajax=target_selection&input=${encodeURIComponent(
    coordInput
  )}&type=coord&request_id=${requestId}&limit=8&offset=0`;

  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const data = await response.json();
    const nestedRequests = data.villages.map(async (village) => {
      await delay(200); // Introduce a delay before each additional request
      const reservation = await fetchAdditionalVillageData(villageSourceId, village.id);
      responses.push({
        coordinate: coordInput,
        player_name: village.player_name,
        VillageTargetId: village.id,
        reservation,
      });
    });

    await Promise.all(nestedRequests);
  } catch (error) {
    console.error("There has been a problem with your fetch operation: ", error);
  }
}

async function fetchAdditionalVillageData(villageSourceId, villageTargetId) {
  const url = `https://br127.tribalwars.com.br/game.php?village=${villageSourceId}&screen=map&ajax=map_info&source=${villageSourceId}&target=${villageTargetId}&`;

  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }
  const data = await response.json();
  return data.reservation;
}

function claimCoordinates(tag) {
  const villageIdRequest = game_data.village.id;
  const playerName = game_data.player.name;

  const textAreaValue = $(`#${tag}_coordsText`).val().trim();
  const coords = textAreaValue.split(/\s+/).filter((coord) => coord.length > 0);
  let requestId = 1;
  const responses = [];
  const unclaimableVillages = [];

  async function processNextCoord(index) {
    if (index < coords.length) {
      const coord = coords[index];
      await fetchTribalWarsData(villageIdRequest, coord, requestId, responses);
      requestId += 1;
      processNextCoord(index + 1);
    } else {
      const resultObj = { villages: responses };
      resultObj.villages.forEach((targetVillage) => {
        if (canClaimVillage(targetVillage, playerName)) {
          claimVillage(targetVillage, villageIdRequest, targetVillage.VillageTargetId);
        } else {
          unclaimableVillages.push(targetVillage.coordinate);
        }
      });
      UI.AjaxPopup(null, "dialog_id", `htmlString`, "Title", null, { dataType: "prerendered" }, 200, "auto", 100, 100);

      console.log("Unclaimable villages:", unclaimableVillages);
    }
  }

  processNextCoord(0); // Start processing from the first coordinate
}

function canClaimVillage(targetVillage, playerName) {
  return targetVillage.player_name !== playerName && targetVillage.reservation === null;
}

function claimVillage(targetVillage, villageIdRequest, targetVillageId) {
  if (targetVillage.reservation === null) {
    console.log(`Claiming village ${targetVillageId} from ${villageIdRequest}: reservation is null`);
  } else {
    console.log(`Claiming village ${targetVillageId} from ${villageIdRequest}`);
  }
}

function releaseCoordinates(tag) {
  console.log(`Releasing coordinates for ${tag}`);
}
