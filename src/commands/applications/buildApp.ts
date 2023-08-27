// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { IActionContext } from '@microsoft/vscode-azext-utils';
import { getLocalizationPathForFile } from '../../util/localization';
import * as nls from 'vscode-nls';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import DaprBuildTaskProvider, {DaprBuildTaskDefinition} from '../../tasks/daprBuildTaskProvider';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

interface DaprBuildConfiguration {
    apps?: DaprAppBuild[]
}

interface DaprAppBuild {
    appID?: string
    appDirPath?: string;
    buildCommands?: string[]
}

export async function startBuild(runTemplateFile: string, taskProvider: DaprBuildTaskProvider): Promise<void> {
    var yamlString = fs.readFileSync(runTemplateFile, 'utf8');
    const projectRoot = path.dirname(runTemplateFile)
    // Parse the YAML string into an object
    var data = yaml.load(yamlString);

    var buildConfig = data as DaprBuildConfiguration
    var buildExecutions: Promise<vscode.TaskExecution>[] = []
    var apps = buildConfig.apps as DaprAppBuild[]
    for (const app of apps) {
        if (!app.appDirPath || !app.buildCommands || app.buildCommands.length == 0) {
            continue
        }
        var cwd = path.resolve(projectRoot, app.appDirPath);
        var appPathName = app.appID? app.appID: path.basename(app.appDirPath);
        const taskDefinition: DaprBuildTaskDefinition = {
            type: "dapr-build",
            cwd: cwd,
            buildCommands: app.buildCommands
        }
        
        const resolvedTask = await taskProvider.resolveTask(
            new vscode.Task(
                taskDefinition,
                vscode.TaskScope.Workspace,
                `${localize("vscode-dapr.builds.building", "building")} ${appPathName}`,
                "Dapr"
            )
        );

        if (!resolvedTask) {
            throw new Error(localize('commands.applications.startRun.unresolvedTask', 'Unable to resolve a task for the build.'));
        }
        buildExecutions.push(new Promise((resolve, reject) => {
            vscode.tasks.executeTask(resolvedTask).then(resolve, reject)
        }))
    }

    await Promise.all(buildExecutions)
}

const createBuildAppCommand = (taskProvider: DaprBuildTaskProvider) => (context: IActionContext, uri: vscode.Uri): Promise<void> => {
    const folder = vscode.workspace.workspaceFolders?.[0];

    if (folder === undefined) {
        throw new Error(localize('commands.applications.startRun.noWorkspaceFolder', 'Build Dapr apps requires an open workspace.'));
    }

    return startBuild(uri.fsPath, taskProvider);
}

export default createBuildAppCommand;
