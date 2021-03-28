# for download single log and process
```
export STREAM=f77ec43f8c2749fcb9287e631b17807d
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