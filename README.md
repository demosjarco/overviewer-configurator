# overviewer-configurator
An UI wrapper for [Overviewer](https://github.com/overviewer/Minecraft-Overviewer) that handles everything from map configuration to actually running it, all in an [Electron](https://github.com/electron/electron) application that runs on Windows and MacOS (Linux soon™)

## Running
1. Download from [Releases](https://github.com/demosjarco/overviewer-configurator/releases) tab
2. Extract zip
3. Run the `.exe` (for windows) or `.app` (for mac)

## Installation
### Pre-compiled
1. If you use MacOS, make sure to have [Python 3](https://www.python.org/downloads/mac-osx/) installed
* There are some experimental installers for windows (`Setup.exe`)
* These are meant for a future release where Squirrel autoUpdate will be implemented and I have the money for a Windows Authenticode certificate

### From Source
1. Make sure you have [NodeJS](https://nodejs.org/en/download/) 10.5 or later installed. If you use MacOS, make sure to have [Python 3](https://www.python.org/downloads/mac-osx/) installed
2. Clone project
3. Run `npm i` to install everything needed (Don't worry, it won't take long)
4. Run `npm start` to run the tool

## Usage

### Basics
1. Install an Overviewer version by expanding `Overviewer` and choosing whichever version you want (latest version is at the top)
2. Go to `Choose Folder` under `Minecraft Worlds` and choose the folder containing the minecraft world(s)
3. Go to `Choose Folder` under `Overviewer Maps` and choose the folder to place finished map files
4. When ready, click one of the `Render` buttons under `Render Progress`
	* `Render Maps` will render the maps as normal
	* `Render POIs` will render the points of interest. This will not render the map (you still need to click `Render Map`)
	* `Update web assets` updates web assets, including custom assets, without starting a render. This won’t update overviewerConfig.js, but will recreate overviewer.js. **This is almost never needed**
	* If you run more than 1 render at a time (ex: map and pois at same time) the UI might glitch out. But each render runs independantly and nothing bad actually happens. UI should fix itself too once last render finishes.
5. ~~The `Global` tab contains the following render settings~~ *Coming Soon*
	* Texture pack
	* Changelist (output every file chagne to a txt file)
	* Option to display render progress on map (`JSObserver`)
	* Cave Shading (Enable color based depth shading for cave renderes)
	* Image Format (png, jpg, or webp) and specific settings to those including compression
6. ~~The `POI` tab will let you create your own POIs~~ *Coming Soon: foll*
7. The `Logs` tab contains detailed progress info and render progress

### Configuration
* A scrollable list of all the minecraft worlds detected appears on the left sidebar under `Worlds`
* By default everything is rendered on every world detected

#### Map Renders
* The text in the brackets is the world shortname. This name is made up by the first letter or number of every word in the world name. Make sure that no other world has the same shortname as it is used internally and will probably lead to problems
* The name after it is your world name and is what will be seen as on the map
* The compasses on the right side are so you can choose what direction to render the map in. You can choose any combination of them as long as at least one is selected
* More coming soon!

#### POIs
* ~~As of right now, there is no customization of them besides choosing to render or not render them~~ Comming Soon!
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
		if poi["id"] == "Chest" or poi["id"] == "minecraft:chest":
			if not "Items" in poi:
				return "Chest with items"
			else:
				return "Chest with %d items" % len(poi["Items"])
	```
	* Chests (in cave renders)
	```python
	def caveChestIcons(poi):
		if poi["id"] == "Chest" or poi["id"] == "minecraft:chest":
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
        poi['icon'] = "https://overviewer.org/avatar/%s" % poi['EntityId']
        info = "[%s] \n %s \n" % (poi["id"], poi["EntityId"])
        info += "Health: %i\tFood: %i \n" % (poi["Health"], poi["foodLevel"])
        item_sum = 0
        for item in poi["Inventory"]:
            item_sum += item["Count"]
        info += "%i items" % item_sum
        return info
    elif poi["id"] == "PlayerSpawn":
        poi['icon'] = "bed.png"
        return "[%s] \n %s \n" % (poi["id"], poi["EntityId"])
	```
	* Player Icons (in cave renders)
	```python
	def cavePlayerIcons(poi):
    if poi["id"] == "Player":
		if poi["z"] <= 128:
			poi['icon'] = "https://overviewer.org/avatar/%s" % poi['EntityId']
			info = "[%s] \n %s \n" % (poi["id"], poi["EntityId"])
			info += "Health: %i\tFood: %i \n" % (poi["Health"], poi["foodLevel"])
			item_sum = 0
			for item in poi["Inventory"]:
				item_sum += item["Count"]
			info += "%i items" % item_sum
			return info
    elif poi["id"] == "PlayerSpawn":
		if poi["z"] <= 128:
			poi['icon'] = "bed.png"
			return "[%s] \n %s \n" % (poi["id"], poi["EntityId"])
	```