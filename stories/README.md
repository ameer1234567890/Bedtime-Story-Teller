```
rm all_stories.mp3 stories.txt
for f in ./*.mp3; do echo "file '$f'" >> stories.txt; done
cat stories.txt | shuf > stories1.txt && rm stories.txt && mv stories1.txt stories.txt
ffmpeg -f concat -safe 0 -i stories.txt -c copy all_stories_0.mp3
```
