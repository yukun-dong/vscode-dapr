// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// import * as fs from 'fs/promises';
import * as path from 'path';
import * as fs from "fs-extra";
import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { getLocalizationPathForFile } from '../util/localization';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { UserInput, WizardStep } from '../services/userInput';
import * as ResourceManagementClient from '@azure/arm-resources';

const localize = nls.loadMessageBundle(getLocalizationPathForFile(__filename));

interface Template {
    name: string;
    label: string;
    url: string;
}

const distributedCalculatorTemplate: Template = {
    name: 'Distributed Calculator',
    label: 'distributed-calculator',
    url: 'https://github.com/IvanJobs/vscode-dapr/releases/download/templates-0.0.1/distributed-calculator.zip'
};

const templates: Template[] = [distributedCalculatorTemplate];

async function getAzureAccount(): Promise<any> {
    const azureAccount =
        vscode.extensions.getExtension<any>("ms-vscode.azure-account")!.exports;
    return azureAccount;
}

async function createResourceGroup(subscriptionId: string, resourceGroupName: string, location: string, credentials: any) {
    const client = new ResourceManagementClient.ResourceManagementClient(credentials, subscriptionId);

    const parameters = {
        location: location
    };

    const result = await client.resourceGroups.createOrUpdate(resourceGroupName, parameters);
    console.log(result);
}
async function scaffoldDaprTemplates(ui: UserInput): Promise<void> {
    await vscode.commands.executeCommand("azure-account.login");
    const azureAccount = await getAzureAccount();
    await azureAccount.waitForSubscriptions();
    let credential2 = azureAccount.subscriptions[0].session.credentials2;
    await createResourceGroup('1756abc0-3554-4341-8d6a-46674962ea19','yukuntest123','eastus',credential2);
}



async function chooseDirectory(): Promise<vscode.Uri | undefined> {
    const options: vscode.OpenDialogOptions = {
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select'
    };
    const result = await vscode.window.showOpenDialog(options);
    return result ? result[0] : undefined;
}

async function downloadZip(url: string): Promise<AdmZip> {
    const zip = await axios.get(url, { responseType: "arraybuffer" });
    return new AdmZip(zip.data);

}

async function unzip(
    zip: AdmZip,
    dstPath: string,
): Promise<void> {
    let entries: AdmZip.IZipEntry[] = zip.getEntries().filter((entry) => !entry.isDirectory);
    for (const entry of entries) {
        let entryName = entry.entryName;
        const filePath: string = path.join(dstPath, entryName);
        const dirPath: string = path.dirname(filePath);
        const rawEntryData: Buffer = entry.getData();
        await fs.ensureDir(dirPath);
        await fs.writeFile(filePath, rawEntryData);
    }
}

const createScaffoldDaprTemplatesCommand = (ui: UserInput) => (): Promise<void> => scaffoldDaprTemplates(ui);

export default createScaffoldDaprTemplatesCommand;
