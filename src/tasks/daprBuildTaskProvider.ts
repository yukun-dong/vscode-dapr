// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import CommandLineBuilder from '../util/commandLineBuilder';
import CommandTaskProvider from './commandTaskProvider';
import { DaprTaskDefinition } from './daprCommandTaskProvider';
import { TelemetryProvider } from '../services/telemetryProvider';
import { IActionContext } from '@microsoft/vscode-azext-utils';
import { DaprInstallationManager } from '../services/daprInstallationManager';
import { TaskDefinition } from 'vscode';

export interface DaprBuildTaskDefinition extends TaskDefinition {
    type: "dapr-build";
    cwd?: string;
    buildCommands?: string[];
}

export default class DaprBuildTaskProvider extends CommandTaskProvider {
    constructor(telemetryProvider: TelemetryProvider) {
        super(
            (definition, callback) => {
                return telemetryProvider.callWithTelemetry(
                    'vscode-dapr.tasks.build',
                    async (context: IActionContext) => {
                        const daprDefinition = definition as DaprBuildTaskDefinition;
                        if (!daprDefinition.buildCommands || daprDefinition.buildCommands.length == 0) {
                            // just simply ignore this build definition
                            return Promise.resolve();
                        }
                        
                        var combinedCommand = daprDefinition.buildCommands.join(" && ");
                        return callback(combinedCommand, { cwd: definition.cwd });
                    });
            },
            /* isBackgroundTask: */ true,
            /* problemMatchers: */ ['$dapr']);
    }
}