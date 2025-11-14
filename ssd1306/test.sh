#!/bin/sh
set -e
I2C=$1
[ -z "$I2C" ] && exit 1

ROTATE=180
# clear display every round for broken displays
CLEAR=false

LINELEN=21 # 128/6
MAX=42 # 2 lines
TEXT="Hello world!"


len=`echo "$TEXT" | wc -c`
if [ $len -gt $MAX ]; then
	echo "Text too long (max $MAX chars)" >&2
	exit 1
fi
fillround=$(( ($MAX + $len) / $len )). 
offset=0

ssd1306 -n $I2C -I 128x32
# rotate display
ssd1306 -n $I2C -r $ROTATE
if $CLEAR; then
	sleep 1
else
	ssd1306 -n $I2C -c
fi
while :; do
	halfstart=$(($offset + $LINELEN))
	text=""
	for i in $(seq 0 $fillround); do
		text="$text ${TEXT}"
	done
	$CLEAR && ssd1306 -n $I2C -c
	msg="`date '+%Y-%m-%d %H:%M:%S'`"'  \n'"${text:$offset:$LINELEN}"'\n'"${text:$halfstart:$LINELEN}"'\n'"`date '+%Y-%m-%d %H:%M:%S'`  "
	ssd1306 -n $I2C -m "$msg"
	sleep 1
	offset=$(( ($offset + 1) % $len ))
done
exit 0
