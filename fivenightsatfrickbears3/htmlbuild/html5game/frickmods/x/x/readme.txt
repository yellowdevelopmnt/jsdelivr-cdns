HELLO! This is the documentation for how to use custom guards as of version 1.1.0.
Be sure to reference this document when making your custom guard. Also be sure to reference the one in the "SPOIELRS" folder for anything not found here. Naturally, be wary of spoilers in there!

Files, properties, and anything else mandatory for a guard to have will be denoted with an * asterisk, so make sure to prioritize them!
This document will go through each file and relevant data type, along with how to implement them. Make sure they all use the correct names and directories, or else they will not work!

Also ensure that your guard's folder is placed within the users/(your name)/AppData/Local/Frickbears3/addons folder. The title of this main folder will be used for your guard's ingame name, so title it appropriately! (It should be noted that any text in parentheses within the folder title is removed when rendered in the game, so for example, a guard named "Mike (Awesome Version)" would simply appear as "Mike" ingame. This is to allow compatibility for multiple custom guards with the same first name!)

== TEXT ASSETS ==
	Text assets are stored as .txt files, and are easily editable in Notepad (though I recommend using Notepad++ for easier control!)
	
	- README.txt
		The basic documentation file -- the one you're reading right now! You're free to remove it if you'd like, it doesn't do anything behind the curtains.
	
	- properties.txt
		One of the most important files for custom guards -- this allows you to set several customizable properties and miscelaneous lines of dialogue for guards!
		Please reference the "PROPERTIES" chapter for detailed information.
	
	- *extras_info.txt
		Provides all information for the guard in the Extras Gallery. Stores the guard's full name, description, and developer notes as strings.
		If applicable, you should include the guard's original debut in their description if they originate from pre-existing media!
	
	- *opening_dialogue.txt
		The dialogue for the guard upon starting a new game.
		This file will not be referenced if the "new_opening_dialogue" property is set to true, but you should still include this file for compatibility with game versions prior to 1.0.7!
		The "DIALOGUE" value should store each line of dialogue in a comma-seperated array, and the "FIRST_PERSON" value should be a true/false boolean which determines if it's the guard or the narrator speaking.


== IMAGE & SOUND ASSETS ==
	Image assets are stored as .png files, editable in art programs like GIMP, paint.net, FireAlpaca, Aseprite, and many, MANY more.
	Sound assets are stored as .ogg files, editable in audio editor programs like Audacity.
	
	- *portrait.png
		The portrait for the guard in the Extras Gallery. Can be any resolution you want! Think of it as the guard's key art.
	
	- *icon.png
		A 48x48 image which serves as the general icon for the guard. Typically is a front-facing shot of their face.
	
	- *outside.png
		A 640x256 image that appears during the opening cutscene. Should depict the guard looking up at the pizzeria.
	
	- *silhouette.png
		A 96x128 image depicting a silhouette of the guard standing in front of the pizzeria after leaving the taxi.
	
	- *reflection.png
		A 1280x360 image depicting the guard looking back at their camera monitor as they are opening it.
		The image should be split into two halves -- the leftmost half depicting them normally, while the rightmost one depicting them while in peril.
	
	- mask.png
		A 1280x480 image depicting the interior of the mask your guard is wearing.
		Just like reflection.png, it should be split in two halves -- the leftmost half is your guard's regular mask, while the rightmost one is when you have the "Cool Glasses" upgrade. The top and bottom 60 pixels are cut off when the mask is being worn, with the bottom only being visible when putting it on.
	
	- *minigame.png
		A 64x16 image depicting four frames of the guard as they appear in the intermissions before salvage sequences.
		Make sure to only use the four colors seen in the example, else they won't recolor correctly from location-to-location.
	
	- *textsound.ogg
		A sound effect which plays whenever the guard speaks. It is recommended you match the length of the provided sample, to prevent it from layering over itself and being much louder ingame.


== PROPERTIES ==
	All properties must be formatted as follows:
	
	"property_name" : <property_value>,
	
	The "property_name" field must be replaced with the name of the property as a string (aka surrounded by quotation marks).
	The <property_value> field depends on the property, and can be a number, string, boolean, or array. The comma should be removed if the property is the last in the document.
	
	Note that you can add or remove any property as you wish -- all of them have default values if left missing in this document.
	The full list of properties this document can set is as follows:

	-"theme_intro" | Array | Default: [musGuardOpening, 1]
		Allows customization for the theme that plays during your guard's title screen introduction. The value should comprise of an array containing a string and a number.
		The string should be a reference to a .ogg audio file in the "songs" folder, and the number should be the volume for the song (0 = 0% volume, 1 = 100% volume).
		For instance, ["sfx_guard_dies.ogg", 0.5] will play a .ogg file named "sfx_guard_dies" in the "songs" folder at 50% volume.


	- "theme_game_over" | Array | Default: [sfxWarioLose, 1]
		Same as above, but for the theme that plays upon dying to an animatronic.
	
	- "theme_victory" | Array | Default: [sfxWarioWin, 0.75]
		Same as above, but for clearing the night. Keep in mind this replaces the track "6:00 AM", and NOT the alarm bell sound.
	
	- "theme_victory_night5" | Array | Default: [sfxWarioWinDeluxe, 0.5]
		Ditto, but for clearing night five. Just like above, this replaces the track "6:00 AM (Night 5)", not the bells.
	
	- "music_player" | Array | Default: []
		Allows for adding any tracks in the "songs" folder to the Music Player.
		Each value in the array should be another array containing five things. In order: Name (string), filename (string), tempo in beats per minute (number), original name (string), and original source (string).
		Additionally, a sixth value may be passed if you wish your song to be able to loop. It must be an array which contains the start and end points for your loop.
		Based on this information, an example for a complete value would be:
		[
			["Game Over (Guard)", "game_over.ogg", 190, "Defeat", "The Game of Doohickery"],
			["Guard's Cool Song", "guard_song.ogg", 140, "Doohickey Factory", "The Game of Doohickery", [23.5, 172.3]],
			["Guard's Scary Song", "guard_song_alt.ogg", 120, "Doohickey Factory (Night)", "The Game of Doohickery", [25.2, 196.5]]
		]
	
	- "new_opening_dialogue" | Boolean | Default: false
		If the value is true, the game will check in the "dialogue" folder for "cutscene_Opening.txt", and will use that file for the dialogue when beginning a new game.
		If false, the game will use "opening_dialogue.txt" in the root folder. You can use this property if you want your guard to have more dialogue options compared to the old system.
	
	- "player_height" | Number | Default: 48
		Determines the guard's height during salvage sequences. Has a minimum of 24 and a maximum of 80.
	
	- "player_sneak_height" | Number | Default: 16
		Ditto, but for when the guard is sneaking. Has a minimum of 8 and a maximum of 24.
	
	- "upgrade_cadet_story" | Array
		Dialogue for when inturrupting the Upgrade Cadet as it is telling Jack and the Beanstalk.
	
	- "withered_bonnie" | String | "gordo"
		Insult for when Withered Bonnie is speaking to the guard in Spanish.
	
	- "bb_quiz_answer" | String | "I was modded in"
		Answer for BB's quiz when he gives the question "What's your reason for working here?".
	
	- "helpy" | Array
		Dialogue for after Helpy offers himself as a "bear buddy" and the guard tries to correct him on already having one.
	
	- "psy_friend_fredbear_house" | Array
		Dialogue for when arriving at the Willaim's Woods salvage location, and the guard questions the need to salvage there.
	
	- "dreadbear" | Array
		Dialogue for when Dreadbear addresses the guard as "YOU! NIGHT GUARD!" before asking for a tasty snack.
	
	- "maze_rules_poster" | Array
		Dialogue for the guard after reading the rules poster at Freddy Fazbear's Pizza.
	
	- "maze_newspaper_1" | Array
		Ditto, after reading the newspaper clipping at Freddy Fazbear's Pizza.
	
	- "maze_newspaper_2" | Array
		Ditto, after reading the newspaper clipping at The New & Improved Freddy Fazbear's Pizza.
	
	- "maze_newspaper_3" | Array
		Ditto, after reading the newspaper clipping at Fazbear's Frights.


== DIALOGUE ==

	Dialogue scripts are stored as text files. All of them go in the "dialogue" folder.
	Each dialogue script has the prefix "cutscene_" in their name, followed by the scene the script is for. An example would be "cutscene_Midnight_Night1.txt".
	Dialogue scripts are formatted as an array containing "lines" in order of their execution, with these lines also being individual arrays containing each line's data.
	
	/!\ As an important note, it is VERY easy to mess up the formatting on dialogue when writing them. Humans are prone to mistakes!
	If you get a crash upon starting a cutscene with a "JSON parse error", then that's the reason.
	I recommend running your scripts through a JSON validator when you're finished with them. (I used jsonlint.com, but any validator works!)
	
	Below is an example of what a valid dialogue script might contain and look like:
	
	{"DIALOGUE":
		[
			["Did you watch the kickboxing match last night?", "Speaker 1"],
			["_skip"],
			["Kickboxing? What's that? You made that up, didn't-", "Speaker 2"],
			["You're sooooooo dumb.", "Speaker 1"]
		], 
	}
	
	As demonstrated, lines usually contain text and a speaker, both defined as strings.
	And the game will handle lines exactly like this! It'll add a page of dialogue using both of that data.
	
	However, certain keywords will instead execute different behavior, all denoted with an _ underscore as a prefix. For instance, that ["_skip"] line
	will instead cause the following line of dialogue to not pause for user input, skipping that step and jumping to the next line.
	These commands can also take extra arguments to alter how they behave, which can be used as you see fit.
	Below is a list of all non-spoiler commands available to use:
	
	- ["_skip"]
		As previously stated, this will skip over the user input in the next like of dialogue.
		Useful for when you want a character's line to get inturrupted by something.
		
		Example:
			["_skip"],
			["Man, I really hope that nothing surprises me right now. That would really-", "Zeb"],
			["HEEEEYYYYY!!!!!!", "Avery"]
	
	- ["_delay", <frames>]
		Used to delay the next line of dialogue from being read by a certain amount of time.
		The <frames> argument determines how long this delay lasts in terms of frames.
		Frickbear's 3 runs at 60 frames per second, so 60 frames = one second of delay.
		
		Example:
			["Man, I really hope that nothing surprises me right now. That would really suck!", "Squeaks"],
			["_delay", 120],
			["...What, nothing? Laaaaame.", "Squeaks"]
	
	- ["_effect", <startingChar>, <endingChar>, <type>]
		Applies an effect to the previous line of dialogue.
		The first and last letters affected are defined as numbers in the <startingChar> and <endingChar> arguments.
		The type of effect is, naturally, defined in the <type> argument as a string, which can either be "Shake" or "Spin".
		Truthfully, though, only the shake effect is used anywhere in the game, and I've never seen the spin effect.
		
		Example:
			["EEEK! I'M AFRAID OF LIGHTNING!!", "Hazel"],
			["_effect", 0, 4, "Shake"],
			["_effect", 20, 99, "Shake"],
	
	- ["_lock"]
		Locks the next line of dialogue from accepting user input to continue or speed through the line.
		Note that this should ONLY be used if a ["_skip"] command is used alongside it!
	
	- ["_buffer"]
		Doesn't do anything visually. Only purpose is for if you must place two ["_func"] commands back to back.
		If so, put a ["_buffer"] command between them.
		
		Oh, and speaking of whiiiich!...
	
	- ["_func", [<function(s)>]]
		Perhaps the most complex command available -- this command will take an array of functions to execute upon reacing this line.
		Note that you should not place two or more ["_func"] commands back to back. The game will only execute the last command.
		If you need to execute multiple functions, either execute multiple functions with the command or, if necessary, run ["_buffer"].
		
		Keep in mind that this command can *NOT* run other commands! It runs unique functions. Try not to get 'em twisted!
		Note that in the following examples, the line breaks do not matter for it to work. It's just easier to read doing it like this.
		
		Examples:
		["_func", [["playSound", "sfxPhoneRing", 10, true]]]
		
		["_func",
			[
				["stopSound", "musMidnight_TheBoss"],
				["playSound", "sfxPhonePickup", 10, false]
			]
		]


== DIALOGUE (EXT.) ==

	Given their importance, I figured a dedicated chapter for the functions would be best to provide.
	All of these functions follow the following format (* asterisk means a given argument is optional):
	
	["functionName", <function_parameters>]
	
	Below is a list of all spoiler-free functions available to use:
	
	- ["fadeOut", <seconds>]
		Fades the screen to black.
		<seconds> is a number that determines how long it takes for this to complete.
	
	- ["fadeIn", <seconds>]
		Ditto, but for fading the screen from black.
	
	- ["playSound", <sound>, <priority>, <loop>, *<volume>]
		Plays a sound effect.
		<sound> is a string that refers to a sound asset in-game.
		<priority> is a number that sets the channel priority for the sound (all instances of this are 10 in-game, so you can just leave it at that if you don't understand!)
		<loop> is a boolean that determines if the sound will loop or not. Typically set to false.
		*<volume> is a number that determines the volume/gain of the sound. A value of 0 = 0% volume, and a value of 1 = 100% volume.
	
	- ["playMusic", <track>, <volume>]
		Plays a music track.
		<track> is a string that refers to a sound asset in-game, though music usually has the prefix "mus_".
		<volume> is the same as above.
	
	- ["fadeMusic", <sound>, <newVolume>, <ms>]
		Fades a sound to a new volume level over a given amount of time. Usually used for music tracks, but it works with all sounds!
		<sound> is a string that refers to the sound asset to fade.
		<newVolume> is a number that the sound will set to. Uses the same metric as above.
		<ms> is a number which is the amount of time it takes to fade the sound in milliseconds. 1000ms = 1 second.
	
	- ["salvage"]
		Goes to the next salvage sequence.
	
	- ["credits"]
		Goes to the credits screen of the game.

* NOTE: If you're too lazy to write out all this custom dialogue, or just don't feel like writing specific scenes, you can just leave them out of the folder. Any missing dialogue files will be replaced with generic universal guard dialogue ingame.

That's all of the documentation for custom guards! At least, everything that's not spoiiilersssss... :3c
Again, so long as you don't care for spoilers or have already seen everything in the game, be sure to look in there! There's a number of things left out here which can be found there!

Thanks for reading this, and good luck with your guard modding!
Written with love by BubbledDEV <3