# Recreate the worker as a regular Container App (not functionapp)
# This fixes the scaling issue where Azure scales down the Function App worker
# because no Function triggers are configured.
#
# Run this script to delete the old functionapp worker and create a proper Container App:
#
#   1. Delete the existing functionapp:
az containerapp delete --name scholarx-worker --resource-group ScholarX_Production --yes
#
#   2. Create as a regular Container App with Service Bus scale rule:
az containerapp create `
  --name scholarx-worker `
  --resource-group ScholarX_Production `
  --environment ScholarX-Production `
  --image scholarxregistry.azurecr.io/scholarx-worker:40b2eb5b494ddabe3f14077474ad9f707be31946 `
  --registry-server scholarxregistry.azurecr.io `
  --registry-identity system `
  --cpu 0.25 `
  --memory 0.5Gi `
  --min-replicas 1 `
  --max-replicas 10 `
  --scale-rule-name service-bus-queue-rule `
  --scale-rule-type azure-servicebus `
  --scale-rule-metadata "queueName=certificate-artifact-generation" "messageCount=1" "activationMessageCount=0" `
  --scale-rule-auth "connection=kv-azure-service-bus-connection-string" `
  --system-assigned `
  --workload-profile-name Consumption
