# Sunset Notice

This repository is being sunsetted because the upstream xNocken parser repository is no longer up to date.

Please use the new repository instead:

https://github.com/xdeltax/Play.Parse.Analyze.Repeat...Fortnite.Replay.Decompressor

The new project parses replays more reliably and is based on Shiqan's original code.

# Fortnite Replay Parser for Node.js.

This tool reads Fortnite replay files (.replay), parses them to JSON, and stores the results in a DECODED subfolder.

## Screenshot

![Screenshot](/img/Screenshot-2024-05-05-214057.png?raw=true "Replay parser sample")

## Installation

```bash
git clone https://github.com/xdeltax/FortniteReplayParser.NodeJS.git
cd FortniteReplayParser.NodeJS
npm install
```

## Start (Node.js)

```bash
node index.js
```

On startup, the first existing replay directory is selected and then watched continuously.

## What the EXE does

The standalone EXE does exactly the same as running node index.js:

1. It searches for a replay directory in a fixed order.
2. It watches that directory for new or changed .replay files.
3. It parses replays to JSON.
4. It saves JSON files in the DECODED subfolder of the selected replay directory.

## Search order for replay files

The application checks these folders in this exact order and uses the first one that exists:

1. %USERPROFILE%\AppData\Local\FortniteGame\Saved\Demos\
2. ..\Demos\
3. .\Demos\
4. .\DemosTEST\
5. .\REPLAYS\
6. .\

Note: Relative paths are resolved from the current working directory where the EXE or node index.js is started.

## Where parsed JSON files are saved

Output path is always:

<selected_replay_directory>\DECODED\<filename>.replay.json

Example:

If .\REPLAYS\ is used, files are written to .\REPLAYS\DECODED\

## Runtime keyboard controls

After startup, the tool reacts to these keys:

- N: Parse only new replays (files without an existing JSON output)
- L: Reparse all replays (overwrites JSON)
- F: Show more detailed output
- C: Show compact output for the last processed replay
- I, H, ?: Show help
- Q or Ctrl+C: Exit

## Build standalone EXE (Windows)

Build the EXE into the dist folder:

```bash
npm install --save-dev pkg
npx pkg index.js --targets node18-win-x64 --output .\dist\FortniteReplayParser.exe
```

Then start it with:

```bash
.\dist\FortniteReplayParser.exe
```

## Parser fallback note

If packet parsing fails for certain replays, the tool automatically retries with parsePackets=false so the replay can still be saved as JSON whenever possible.

## Parser projects used

- fortnite-replay-parser: https://github.com/xNocken/replay-reader
- replay-reader: https://github.com/ThisNils/node-replay-reader/tree/master
- fn-replay-parser: https://github.com/remoblaser/fn-replay-parser
