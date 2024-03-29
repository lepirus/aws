import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { HitCounter } from './hit-counter';

export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // defines an AWS Lambda resource
    const helloLambda = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,    // execution environment
      code: lambda.Code.fromAsset('lambda'),  // code loaded from "lambda" directory
      handler: 'hello.handler'                // file is "hello", function is "handler"
    });

    const helloWithCounterLambda = new HitCounter(this, 'HelloHitCounter', {
      downstream: helloLambda
    });

    // defines an API Gateway REST API resource backed by our "hello" function
    new apigw.LambdaRestApi(this, 'Endpoint CdkWorkshop', {
      handler: helloWithCounterLambda.handler
    });
  }
}
