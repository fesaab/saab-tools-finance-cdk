# Saab Tools Finance CDK

CDK project to deploy Saab Tools Finance modules to AWS.


To build new version of the CDK is necessary to build the TS first and then deploy it:
```
npm run build
cdk deply
```

Or alternatively:
```
npm run watch
cdk deploy
```


## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
