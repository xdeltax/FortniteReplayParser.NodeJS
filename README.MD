fortnite replays parser for nodejs using [npm i fortnite-replay-parser] (https://github.com/xNocken/replay-reader)

## screenshot

![Screenshot](/img/Screenshot 2024-05-05 214057.png?raw=true "replay parser sample")

## install
```
git clone https://github.com/xdeltax/FortniteReplayParser.NodeJS.git
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


npm install --save fortnite-replay-parser (https://github.com/xNocken/replay-reader)

npm install --save replay-reader (https://github.com/ThisNils/node-replay-reader/tree/master)
npm install --save-dev tslib 

npm install --save fn-replay-parser (https://github.com/remoblaser/fn-replay-parser)
