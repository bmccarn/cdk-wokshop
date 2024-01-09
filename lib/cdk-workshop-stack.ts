import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { HitCounter } from './hitcounter';
import { TableViewer } from 'cdk-dynamo-table-viewer';
import { Dashboard, Metric, GraphWidget } from 'aws-cdk-lib/aws-cloudwatch';

export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Defines an AWS Lambda resource
    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_16_X, // execution environment
      code: lambda.Code.fromAsset('lambda'), // code loaded from "lambda" directory
      handler: 'hello.handler' // file is "hello", function is "handler"
    });

    const helloWithCounter = new HitCounter(this, 'HelloHitCounter', {
      downstream: hello
    });

    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: helloWithCounter.handler
    });

    new TableViewer(this, 'ViewHitCounter', {
      title: 'Hello Hits',
      table: helloWithCounter.table
    });

    // Create a CloudWatch Dashboard
    const dashboard = new Dashboard(this, 'Dashboard', {
      dashboardName: 'MyCDKAppDashboard' 
    });

    // Create a Metric for Lambda Invocations
    const lambdaInvocationsMetric = new Metric({
      metricName: 'Invocations',
      namespace: 'AWS/Lambda',
      dimensionsMap: {
        FunctionName: hello.functionName,
      },
      statistic: 'Sum',
      // You can specify other properties like 'period', 'statistic', etc., if needed
    });

    // Create a GraphWidget for the Metric
    const lambdaInvocationsWidget = new GraphWidget({
      title: "Lambda Invocations",
      width: 6,
      height: 6,
      left: [lambdaInvocationsMetric],
      // You can add more configuration to the widget as needed
    });

    // Add the Widget to the Dashboard
    dashboard.addWidgets(lambdaInvocationsWidget);
    

  }
}
