"""Copy the common cloud service icons from the official packs into the site.

Usage: python3 scripts/service-icons.py <packs dir>

<packs dir> holds the three official downloads, unzipped:
  aws/    AWS Architecture Icons (aws.amazon.com/architecture/icons), the 2026-07-31 package
  azure/  Azure_Public_Service_Icons_V25.zip (learn.microsoft.com/azure/architecture/icons)
  gcp/    google-cloud-icons.zip (cloud.google.com/icons)

Writes public/icons/services/<provider>/<id>.svg and app/_brand/serviceIcons.ts.
The icons are used as the vendors allow: in architecture diagrams, unaltered
(no cropping, recolouring, or rotation; three get a small margin, see PAD), with the service name next to them.
"""

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PACKS = pathlib.Path(sys.argv[1])
OUT = ROOT / "public/icons/services"

# id, name shown in a diagram, aliases a model or a page may use, file in the pack
AWS = "aws/Architecture-Service-Icons_07312026"
AWS_ICONS = [
    ("ec2", "Amazon EC2", ["EC2"], "Amazon-EC2"),
    ("lambda", "AWS Lambda", ["Lambda"], "AWS-Lambda"),
    ("fargate", "AWS Fargate", ["Fargate"], "AWS-Fargate"),
    ("ecs", "Amazon ECS", ["ECS", "Elastic Container Service"], "Amazon-Elastic-Container-Service"),
    ("eks", "Amazon EKS", ["EKS", "Elastic Kubernetes Service"], "Amazon-Elastic-Kubernetes-Service"),
    ("ecr", "Amazon ECR", ["ECR", "Elastic Container Registry"], "Amazon-Elastic-Container-Registry"),
    ("app-runner", "AWS App Runner", ["App Runner"], "AWS-App-Runner"),
    ("batch", "AWS Batch", [], "AWS-Batch"),
    ("s3", "Amazon S3", ["S3", "Simple Storage Service"], "Amazon-Simple-Storage-Service"),
    ("rds", "Amazon RDS", ["RDS"], "Amazon-RDS"),
    ("aurora", "Amazon Aurora", ["Aurora"], "Amazon-Aurora"),
    ("dynamodb", "Amazon DynamoDB", ["DynamoDB"], "Amazon-DynamoDB"),
    ("elasticache", "Amazon ElastiCache", ["ElastiCache"], "Amazon-ElastiCache"),
    ("redshift", "Amazon Redshift", ["Redshift"], "Amazon-Redshift"),
    ("athena", "Amazon Athena", ["Athena"], "Amazon-Athena"),
    ("glue", "AWS Glue", ["Glue"], "AWS-Glue"),
    ("kinesis", "Amazon Kinesis", ["Kinesis"], "Amazon-Kinesis"),
    ("opensearch", "Amazon OpenSearch Service", ["OpenSearch"], "Amazon-OpenSearch-Service"),
    ("sqs", "Amazon SQS", ["SQS", "Simple Queue Service"], "Amazon-Simple-Queue-Service"),
    ("sns", "Amazon SNS", ["SNS", "Simple Notification Service"], "Amazon-Simple-Notification-Service"),
    ("eventbridge", "Amazon EventBridge", ["EventBridge"], "Amazon-EventBridge"),
    ("step-functions", "AWS Step Functions", ["Step Functions"], "AWS-Step-Functions"),
    ("api-gateway", "Amazon API Gateway", ["API Gateway"], "Amazon-API-Gateway"),
    ("cloudfront", "Amazon CloudFront", ["CloudFront"], "Amazon-CloudFront"),
    ("route-53", "Amazon Route 53", ["Route 53", "Route53"], "Amazon-Route-53"),
    ("elb", "Elastic Load Balancing", ["ELB", "ALB", "Application Load Balancer", "Load Balancer"], "Elastic-Load-Balancing"),
    ("vpc", "Amazon VPC", ["VPC"], "Amazon-Virtual-Private-Cloud"),
    ("cloudwatch", "Amazon CloudWatch", ["CloudWatch"], "Amazon-CloudWatch"),
    ("cloudformation", "AWS CloudFormation", ["CloudFormation"], "AWS-CloudFormation"),
    ("iam", "AWS IAM", ["IAM", "Identity and Access Management"], "AWS-Identity-and-Access-Management"),
    ("secrets-manager", "AWS Secrets Manager", ["Secrets Manager"], "AWS-Secrets-Manager"),
    ("kms", "AWS KMS", ["KMS", "Key Management Service"], "AWS-Key-Management-Service"),
    ("cognito", "Amazon Cognito", ["Cognito"], "Amazon-Cognito"),
    ("bedrock", "Amazon Bedrock", ["Bedrock"], "Amazon-Bedrock"),
    ("sagemaker", "Amazon SageMaker", ["SageMaker"], "Amazon-SageMaker"),
]

AZURE = "azure/Azure_Public_Service_Icons/Icons"
AZURE_ICONS = [
    ("app-service", "Azure App Service", ["App Service"], "App-Services"),
    ("functions", "Azure Functions", ["Function Apps", "Functions"], "Function-Apps"),
    ("aks", "Azure Kubernetes Service", ["AKS"], "Kubernetes-Services"),
    ("container-apps", "Azure Container Apps", ["Container Apps"], "Container-Apps-Environments"),
    ("container-instances", "Azure Container Instances", ["ACI", "Container Instances"], "Container-Instances"),
    ("container-registry", "Azure Container Registry", ["ACR", "Container Registry"], "Container-Registries"),
    ("static-web-apps", "Azure Static Web Apps", ["Static Web Apps"], "Static-Apps"),
    ("virtual-machine", "Azure Virtual Machines", ["Virtual Machine", "VM"], "Virtual-Machine"),
    ("storage", "Azure Storage", ["Storage Account", "Blob Storage"], "Storage-Accounts"),
    ("sql-database", "Azure SQL Database", ["SQL Database"], "SQL-Database"),
    ("postgresql", "Azure Database for PostgreSQL", ["Azure PostgreSQL"], "Azure-Database-PostgreSQL-Server"),
    ("cosmos-db", "Azure Cosmos DB", ["Cosmos DB"], "Azure-Cosmos-DB"),
    ("redis", "Azure Cache for Redis", ["Azure Redis"], "Cache-Redis"),
    ("service-bus", "Azure Service Bus", ["Service Bus"], "Azure-Service-Bus"),
    ("event-hubs", "Azure Event Hubs", ["Event Hubs"], "Event-Hubs"),
    ("event-grid", "Azure Event Grid", ["Event Grid"], "Event-Grid-Topics"),
    ("logic-apps", "Azure Logic Apps", ["Logic Apps"], "Logic-Apps"),
    ("api-management", "Azure API Management", ["API Management", "APIM"], "API-Management-Services"),
    ("front-door", "Azure Front Door", ["Front Door"], "Front-Door-and-CDN-Profiles"),
    ("load-balancer", "Azure Load Balancer", [], "Load-Balancers"),
    ("application-gateway", "Azure Application Gateway", ["Application Gateway"], "Application-Gateways"),
    ("dns", "Azure DNS", ["DNS Zones"], "DNS-Zones"),
    ("virtual-network", "Azure Virtual Network", ["VNet", "Virtual Network"], "Virtual-Networks"),
    ("key-vault", "Azure Key Vault", ["Key Vault"], "Key-Vaults"),
    ("managed-identity", "Azure Managed Identities", ["Managed Identity"], "Managed-Identities"),
    ("monitor", "Azure Monitor", [], "Monitor"),
    ("application-insights", "Application Insights", ["App Insights"], "Application-Insights"),
    ("log-analytics", "Log Analytics", ["Log Analytics Workspace"], "Log-Analytics-Workspaces"),
    ("openai", "Azure OpenAI", ["Azure OpenAI Service"], "Azure-OpenAI"),
    ("ai-foundry", "Azure AI Foundry", ["AI Foundry", "Microsoft Foundry"], "AI-Foundry"),
    ("ai-search", "Azure AI Search", ["Cognitive Search", "AI Search"], "Cognitive-Search"),
    ("data-factory", "Azure Data Factory", ["Data Factory", "ADF"], "Data-Factories"),
    ("databricks", "Azure Databricks", [], "Azure-Databricks"),
    ("synapse", "Azure Synapse Analytics", ["Synapse"], "Azure-Synapse-Analytics"),
]

GCP_ICONS = [
    ("compute-engine", "Compute Engine", ["GCE"], "compute_engine"),
    ("cloud-run", "Cloud Run", [], "cloud_run"),
    ("cloud-functions", "Cloud Functions", ["Cloud Run functions"], "cloud_functions"),
    ("gke", "Google Kubernetes Engine", ["GKE"], "google_kubernetes_engine"),
    ("app-engine", "App Engine", [], "app_engine"),
    ("artifact-registry", "Artifact Registry", [], "artifact_registry"),
    ("cloud-build", "Cloud Build", [], "cloud_build"),
    ("cloud-storage", "Cloud Storage", ["GCS"], "cloud_storage"),
    ("cloud-sql", "Cloud SQL", [], "cloud_sql"),
    ("firestore", "Firestore", [], "firestore"),
    ("bigtable", "Bigtable", [], "bigtable"),
    ("spanner", "Spanner", ["Cloud Spanner"], "cloud_spanner"),
    ("memorystore", "Memorystore", [], "memorystore"),
    ("bigquery", "BigQuery", [], "bigquery"),
    ("dataflow", "Dataflow", [], "dataflow"),
    ("dataproc", "Dataproc", [], "dataproc"),
    ("pubsub", "Pub/Sub", ["PubSub", "Cloud Pub/Sub"], "pubsub"),
    ("composer", "Cloud Composer", ["Composer"], "cloud_composer"),
    ("scheduler", "Cloud Scheduler", [], "cloud_scheduler"),
    ("tasks", "Cloud Tasks", [], "cloud_tasks"),
    ("workflows", "Workflows", [], "workflows"),
    ("eventarc", "Eventarc", [], "eventarc"),
    ("load-balancing", "Cloud Load Balancing", [], "cloud_load_balancing"),
    ("cloud-dns", "Cloud DNS", [], "cloud_dns"),
    ("cloud-cdn", "Cloud CDN", [], "cloud_cdn"),
    ("vpc", "Virtual Private Cloud", ["GCP VPC"], "virtual_private_cloud"),
    ("api-gateway", "API Gateway", ["GCP API Gateway"], "cloud_api_gateway"),
    ("apigee", "Apigee", [], "apigee_api_platform"),
    ("secret-manager", "Secret Manager", [], "secret_manager"),
    ("kms", "Cloud KMS", ["Key Management Service"], "key_management_service"),
    ("iam", "Cloud IAM", [], "identity_and_access_management"),
    ("monitoring", "Cloud Monitoring", [], "cloud_monitoring"),
    ("logging", "Cloud Logging", [], "cloud_logging"),
    ("vertex-ai", "Vertex AI", [], "vertexai"),
    ("document-ai", "Document AI", [], "document_ai"),
    ("looker", "Looker", [], "looker"),
]


# Icons whose artwork extends up to 0.25 units past their 18x18 frame, so the
# edges would be clipped in an <img>. The wider viewBox adds a 0.3 margin.
PAD = {k: ('viewBox="0 0 18 18"', 'viewBox="-0.3 -0.3 18.6 18.6"') for k in
       ["azure/functions", "azure/virtual-machine", "azure/virtual-network"]}


def aws_src(name):
    hits = sorted(PACKS.joinpath(AWS).glob(f"*/64/Arch_{name}_64.svg"))
    return hits[0] if hits else None


def azure_src(name):
    hits = sorted(p for p in PACKS.joinpath(AZURE).glob("*/*.svg") if p.name.split("-icon-service-", 1)[-1] == f"{name}.svg")
    return hits[0] if hits else None


def gcp_src(name):
    p = PACKS / "gcp" / name / f"{name}.svg"
    return p if p.exists() else None


entries, missing = [], []
for provider, icons, find in [("aws", AWS_ICONS, aws_src), ("azure", AZURE_ICONS, azure_src), ("gcp", GCP_ICONS, gcp_src)]:
    (OUT / provider).mkdir(parents=True, exist_ok=True)
    for id_, name, aliases, src_name in icons:
        src = find(src_name)
        if not src:
            missing.append(f"{provider}/{src_name}")
            continue
        svg = src.read_text()
        if f"{provider}/{id_}" in PAD:  # artwork runs past the frame: add margin, never change the shape
            old, new = PAD[f"{provider}/{id_}"]
            assert old in svg, f"{provider}/{id_}: viewBox changed upstream"
            svg = svg.replace(old, new, 1)
        (OUT / provider / f"{id_}.svg").write_text(svg)
        entries.append({"provider": provider, "id": id_, "name": name, "aliases": aliases})

if missing:
    sys.exit("missing in the packs: " + ", ".join(missing))

ts = f'''/**
 * Cloud service icons from the vendors' official architecture icon packs, for
 * KYLLM diagrams. Generated by scripts/service-icons.py; do not edit by hand.
 * Use them as the vendors allow: in architecture diagrams, unaltered (no
 * cropping, recolouring, or rotation), with the service name next to the icon.
 * Company-level marks (OpenAI, Databricks, Snowflake) stay in /public/logos.
 */

export type ServiceIcon = {{ provider: "aws" | "azure" | "gcp"; id: string; name: string; aliases: string[] }};

export const SERVICE_ICONS: ServiceIcon[] = {json.dumps(entries, indent=2)};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const INDEX = new Map<string, ServiceIcon>();
for (const icon of SERVICE_ICONS)
  for (const key of [icon.name, ...icon.aliases, `${{icon.provider}} ${{icon.id}}`]) {{
    const k = norm(key);
    if (!INDEX.has(k)) INDEX.set(k, icon);
  }}

/** The icon for a service name or alias ("ECS", "Amazon ECS", "Cloud Run"), or null. */
export function serviceIcon(name: string): (ServiceIcon & {{ src: string }}) | null {{
  const icon = INDEX.get(norm(name));
  return icon ? {{ ...icon, src: `/icons/services/${{icon.provider}}/${{icon.id}}.svg` }} : null;
}}
'''
(ROOT / "app/_brand/serviceIcons.ts").write_text(ts)
print(f"{len(entries)} icons")
