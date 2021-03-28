```
export STREAM=f77ec43f8c2749fcb9287e631b17807d
aws --profile=hashidate-prod logs get-log-events --log-group-name /ecs/odawara-mercari-items-collector --log-stream-name ecs/odawara-mercari-items-collector/$STREAM --output text  | node collector-summary.js
```