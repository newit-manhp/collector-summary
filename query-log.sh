#!/bin/sh
id=$(aws logs start-query  --profile hashidate-prod  --log-group-name /ecs/odawara-mercari-items-collector  --start-time `date -v-2d "+%s"`  --end-time `date "+%s"`  --query-string "filter @message like /from mercari/ | parse /(?<item_count>\d+) items collected from .*: '(?<shop>.*)'/ | sort @timestamp desc" | jq '.queryId')
echo "wait 10 seconds for complete query, if the following output is not Complete, please increase wait time"
# # wait for query to complete
sleep 10
echo $id | xargs aws --profile hashidate-prod logs get-query-results --query-id >insight.log
echo $(cat insight.log | jq '.status')
cat insight.log | jq '.results | [.[] |{shop: .[1].value, count: .[0].value}] | unique_by(.shop)|map(.count |= tonumber)|map(.count)|add'