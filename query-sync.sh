#!/bin/sh
id=$(aws logs start-query  --profile hashidate-prod  --log-group-name /ecs/odawara-sync-items-v2  --start-time `date -v-1d "+%s"`  --end-time `date "+%s"`  --query-string "filter @message like /synchronization started \{|items deleted|items added|items collected from xianyu/| parse /(?<started>)synchronization started|(?<deleted>\d+\/\d+) items deleted|(?<added>\d+\/\d+) items added|(?<xinanyu>\d+) items collected from xianyu/| parse /\{ shop: '(?<shop>.*)' \}/| sort @timestamp desc" | jq '.queryId')
echo "wait 10 seconds for complete query, if the following output is not Complete, please increase wait time"
# # wait for query to complete
sleep 10
echo $id | xargs aws --profile hashidate-prod logs get-query-results --query-id >insight.log
echo $(cat insight.log | jq '.status')
cat insight.log|jq '.results | [.[] |{shop: .[1].value, op: .[0].field, value: .[0].value}] | group_by('.shop')'>sync-processed.json
node sync-analyze.js "$(cat sync-processed.json)"