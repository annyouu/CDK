import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as path from "path";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda関数の定義
    const helloFn = new NodejsFunction(this, "HelloFunction", {
      entry: path.join(__dirname, "../lambda/hello.ts"),
      handler: "handler",
    });

    // API Gatewayの定義
    new apigw.LambdaRestApi(this, "HelloApi", {
      handler: helloFn,
    });
  }
}
