import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface HitCounterProps {
    downstream: lambda.IFunction;

    // The read capacity units for the table. Must be greater than 5 and lower than 20. @default 5
    readCapacity?: number;
}

export class HitCounter extends Construct {

    /** allows accessing the counter function */
    public readonly handler: lambda.Function;

    constructor(scope: Construct, id: string, props: HitCounterProps) {
        if (props.readCapacity !== undefined && (props.readCapacity < 5 || props.readCapacity > 20)) {
            throw new Error('readCapacity must be greater than 5 and less than 20');
        }

        super(scope, id);

        const table = new dynamodb.Table(this, 'Hits', {
            partitionKey: {name: 'path', type: dynamodb.AttributeType.STRING},
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            readCapacity: props.readCapacity ?? 5,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        this.handler = new lambda.Function(this, 'HitCounterHandler', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'hit-counter.handler',
            code: lambda.Code.fromAsset('lambda'),
            environment: {
                DOWNSTREAM_FUNCTION_NAME: props.downstream.functionName,
                HITS_TABLE_NAME: table.tableName
            }
        });

        // grant the lambda role read/write permissions to our table
        table.grantReadWriteData(this.handler);

        // grant the lambda role invoke permissions to the downstream function
        props.downstream.grantInvoke(this.handler);
    }
}
