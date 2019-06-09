# overviewer-configurator

## Running
*Coming Soon* ~~Download from [Releases](https://github.com/demosjarco/overviewer-configurator/releases) tab~~
*Follow directions from Installation to run it for now*

## Installation
1. Make sure you have [NodeJS](https://nodejs.org/en/download/) 10.5 or later installed
2. Clone project
3. Run `npm i` to install everything needed (its actually very little compared to other node projects)
4. Run `npm start` to run the tool

## Usage

### Basics
1. Install an Overviewer version by going to `Overviewer` > `Versions` > whichever version you want (latest version is at the top)
2. Go to `Choose Folder` under `World Locations` and choose the folder containing the minecraft world(s)
3. Go to `Choose Folder` under `Output Location` and choose the folder to place finished map files
4. When ready, click `Start` next to `Render Map` to run
    * Render POIs will render the points of interest. This will not render the map (you still need to click `Start` on `Render Map`). If you just render the map, POIs won't render unless you click `Start` on `Render POIs`
    * If you run more than 1 render at a time (ex: map and pois at same time) the UI might glitch out. But each render runs independantly and nothing bad actually happens. UI should fix itself too once last render finishes.
    * Update web assets is almost never needed. `Update web assets, including custom assets, without starting a render. This won’t update overviewerConfig.js, but will recreate overviewer.js`

### Configuration
* A scrollable list of all the minecraft worlds detected appears on the left sidebar
* By default everything is rendered on every world detected

#### Map Renders
* The text in the brackets is the world shortname. This name is made up by the first letter or number of every word in the world name. Make sure that no other world has the same shortname as it is used internally and will probably lead to problems
* The anem after it is your world name and is what will be seen as on the map
* The compasses on the right side are so you can choose what direction to render the map in. You can choose any combination of them as long as at least one is selected
* The checkboxes next to the render name is to actually render it or not. If you expand it, you get more information
  * For some renders you can choose if you use `Smooth Lighting` or not. This will increase render times but look nicer
  * Leave the drop down on normal unless you have issues
    * `Regular` Normal update checking mode
    * `Check Tiles` Forces The Overviewer to check each tile on disk and check to make sure it is up to date. This also checks for tiles that shouldn’t exist and deletes them
    * `Force Render` Forces The Overviewer to re-render every tile regardless of whether it thinks it needs updating or not
    * `Ignore Changes` Keeps render as is and doesn't update or change any part of it

#### POIs
* As of right now, there is no customization of them besides choosing to render or not render them
* Common POIs selection will come later on
* For reference, these POIs will render:
    * Signs
    ```python
    def signIcons(poi):
        if poi["id"] == "Sign" or poi["id"] == "minecraft:sign":
            return "\n".join([poi["Text1"], poi["Text2"], poi["Text3"], poi["Text4"]])
    ```
    * Signs (in cave renders)
    ```python
    def caveSignIcons(poi):
        if poi["id"] == "Sign" or poi["id"] == "minecraft:sign":
            if poi["z"] <= 128:
                return "\n".join([poi["Text1"], poi["Text2"], poi["Text3"], poi["Text4"]])
    ```
    * Chests
    ```python
    def chestIcons(poi):
        if poi["id"] == "Chest":
            if not "Items" in poi:
                return "Chest with items"
            else:
                return "Chest with %d items" % len(poi["Items"])
    ```
    * Chests (in cave renders)
    ```python
    def caveChestIcons(poi):
    if poi["id"] == "Chest":
        if poi["z"] <= 128:
            if not "Items" in poi:
                return "Chest with items"
            else:
                return "Chest with %d items" % len(poi["Items"])
    ```
    * Player Icons
    ```python
    def playerIcons(poi):
        if poi["id"] == "Player":
            poi["icon"] = "https://overviewer.org/avatar/%s" % poi["EntityId"]
                return "Last known location for %s" % poi["EntityId"]
    ```
    * Player Icons (in cave renders)
    ```python
    def cavePlayerIcons(poi):
        if poi["id"] == "Player":
            if poi["z"] <= 128:
                poi["icon"] = "https://overviewer.org/avatar/%s" % poi["EntityId"]
                    return "Last known location for %s" % poi["EntityId"]
