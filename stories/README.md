```
for f in ./*.mp3; do echo "file '$f'" >> stories.txt; done
ffmpeg -f concat -safe 0 -i stories.txt -c copy output.mp3
```
