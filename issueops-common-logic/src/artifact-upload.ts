import artifact, { UploadArtifactOptions } from '@actions/artifact'

/**
 * Uploads an artifact to a specified location.
 * @param artifactName - The name of the artifact.
 * @param filesToUpload - An array of file paths to be uploaded.
 * @param rootDirectory - The root directory of the files to be uploaded.
 * @param options - Additional options for artifact upload.
 * @returns A promise that resolves when the artifact has been successfully uploaded.
 */
export async function uploadArtifact(
  artifactName: string,
  filesToUpload: string[],
  rootDirectory: string,
  options: UploadArtifactOptions
): Promise<void> {
  await artifact.uploadArtifact(
    artifactName,
    filesToUpload,
    rootDirectory,
    options
  )
}
