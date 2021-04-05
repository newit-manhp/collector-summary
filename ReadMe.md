# for download single log and process
```
export STREAM=d3a217eeacae494ead082e042a97179d
aws --profile=hashidate-prod logs get-log-events --log-group-name /ecs/odawara-mercari-items-collector --log-stream-name ecs/odawara-mercari-items-collector/$STREAM --output text  | node collector-summary.js > result.json
```
# for process from file
```
cat log.txt | node collector-summary.js > result.json
```
# for collect multiple file and process
```
export STREAM=f77ec43f8c2749fcb9287e631b17807d
aws --profile=hashidate-prod logs get-log-events --log-group-name /ecs/odawara-mercari-items-collector --log-stream-name ecs/odawara-mercari-items-collector/$STREAM --output text > log.txt

export STREAM=c361f1dc21eb46178de3a5ca1522c2f2
aws --profile=hashidate-prod logs get-log-events --log-group-name /ecs/odawara-mercari-items-collector --log-stream-name ecs/odawara-mercari-items-collector/$STREAM --output text >> log.txt

export STREAM=d3a217eeacae494ead082e042a97179d
aws --profile=hashidate-prod logs get-log-events --log-group-name /ecs/odawara-mercari-items-collector --log-stream-name ecs/odawara-mercari-items-collector/$STREAM --output text >> log.txt

export STREAM=f77ec43f8c2749fcb9287e631b17807d
aws --profile=hashidate-prod logs get-log-events --log-group-name /ecs/odawara-mercari-items-collector --log-stream-name ecs/odawara-mercari-items-collector/$STREAM --output text >> log.txt

cat log.txt | node collector-summary.js > result.json
```


# for log insight
query data with:
```
aws logs start-query \
 --profile hashidate-prod \
 --log-group-name /ecs/odawara-mercari-items-collector \
 --start-time `date -v-3d "+%s"` \
 --end-time `date "+%s"` \
 --query-string 'fields @timestamp,@message | filter @message like /Started for:|Finished for:|items collected from mercari|collector started \{|items of|collector finished \{/'

aws --profile hashidate-prod logs get-query-results --query-id 2fc3c11e-a871-4465-86f4-766e5939bb4c

```
```
fields @timestamp, @message
| filter @message like /Started for:|Finished for:|items collected from mercari|collector started \{|items of|collector finished \{/
| sort @timestamp desc
| limit 2000
```
cat log.log | node collector-summary-insight.js > result.json
```
