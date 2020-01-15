import CommandLineBuilder from '../util/commandLineBuilder';
import CommandTaskProvider from './commandTaskProvider';
import { TaskDefinition } from './taskDefinition';

export interface DaprTaskDefinition extends TaskDefinition {
    appId?: string;
    appPort?: number;
    command?: string[];
    config?: string;
    cwd?: string;
    enableProfiling?: boolean;
    grpcPort?: number;
    httpPort?: number;
    image?: string;
    logLevel?: 'debug' | 'info' | 'warning' | 'error' | 'fatal' | 'panic';
    maxConcurrency?: number;
    placementHost?: string;
    profilePort?: number;
    type: 'daprd';
}

export default class DaprCommandTaskProvider extends CommandTaskProvider {
    constructor() {
        super(
            (definition, callback, token) => {
                const daprDefinition =<DaprTaskDefinition>definition;

                const command =
                    CommandLineBuilder
                        .create('dapr', 'run')
                        .withNamedArg('--app-id', daprDefinition.appId)
                        .withNamedArg('--app-port', daprDefinition.appPort)
                        .withNamedArg('--config', daprDefinition.config)
                        .withFlagArg('--enable-profiling', daprDefinition.enableProfiling)
                        .withNamedArg('--grpc-port', daprDefinition.grpcPort)
                        .withNamedArg('--image', daprDefinition.image)
                        .withNamedArg('--log-level', daprDefinition.logLevel)
                        .withNamedArg('--max-concurrency', daprDefinition.maxConcurrency)
                        .withNamedArg('--placement-host', daprDefinition.placementHost)
                        .withNamedArg('--port', daprDefinition.httpPort)
                        .withNamedArg('--profile-port', daprDefinition.profilePort)
                        .withArgs(daprDefinition.command)
                        .build();

                return callback(command, { cwd: definition.cwd });
            },
            /* isBackgroundTask: */ true,
            /* problemMatchers: */ ['$dapr']);
    }
}