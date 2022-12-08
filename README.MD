fortnite replays parser for nodejs using [npm i fortnite-replay-parser] (https://github.com/xNocken/replay-reader)

## screenshot

![Screenshot](/img/screenshot.png?raw=true "replay parser sample")

## install
```
npm i
```

## run
```
node index.js
```

```
default search folder for replays:
    $homedir./AppData/Local/FortniteGame/Saved/Demos/*.replay

fallback search folders:
    ../Demos/*.replay
    ./Demos/*.replay
    ./REPLAYS/*.replay
    ./*.replay
```

## package nodejs to executable
```
npm install -g pkg
```

## compile for windows
```
pkg index.js -t win -o "xdxReplayParser"
./xdxReplayParser.exe
```

## compile for linux
```
pkg index.js -t linux -o "xdxReplayParser.x64"
./xdxReplayParser.x64
```
