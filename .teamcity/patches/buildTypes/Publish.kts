package patches.buildTypes

import jetbrains.buildServer.configs.kotlin.v2018_2.*
import jetbrains.buildServer.configs.kotlin.v2018_2.buildSteps.ScriptBuildStep
import jetbrains.buildServer.configs.kotlin.v2018_2.buildSteps.script
import jetbrains.buildServer.configs.kotlin.v2018_2.ui.*

/*
This patch script was generated by TeamCity on settings change in UI.
To apply the patch, change the buildType with id = 'Publish'
accordingly, and delete the patch script.
*/
changeBuildType(RelativeId("Publish")) {
    expectSteps {
        script {
            name = "Publish"
            id = "RUNNER_1461"
            scriptContent = """
                #!/bin/bash
                set -e -x
                
                # Required for docker
                mkdir -p ~/.ssh/
                touch ~/.ssh/config
                cat << EOT >> ~/.ssh/config
                Host github.com
                    StrictHostKeyChecking no
                    UserKnownHostsFile /dev/null
                EOT
                
                chmod 644 ~/.ssh/config
                
                # GitHub and NPM authorization
                git config user.email "%github.com.builduser.email%"
                git config user.name "%github.com.builduser.name%"
                
                echo "//registry.npmjs.org/:_authToken=%npmjs.com.auth.key%" > ~/.npmrc
                
                node -v
                npm -v
                npm whoami
                
                if [ -n "${'$'}(git status --porcelain)" ]; then
                  git status
                  echo "Your git status is not clean. Aborting.";
                  exit 1;
                fi
                
                chown -R root:root . # See https://github.com/npm/cli/issues/4589
                mkdir node_modules
                npm install
                npm run build
                
                if [ ! -d "./dist" ]
                then
                    echo "Directory ./dist does NOT exists. Build failed." >>/dev/stderr
                    exit 333
                fi
                
                # Reset possibly changed lock to avoid "git status is not clear" error
                git checkout package.json package-lock.json
                npm run release-ci -- %lerna.publish.options%
                
                cat package.json
                
                function publishBuildNumber {
                    local VERSION=${'$'}(node -p 'require("./package.json").version')
                    echo "##teamcity[buildNumber '${'$'}VERSION']"
                }
                
                publishBuildNumber
                
                #chmod 777 ~/.ssh/config
            """.trimIndent()
            dockerImage = "node:16"
            dockerRunParameters = "-v %teamcity.build.workingDir%/npmlogs:/root/.npm/_logs"
        }
    }
    steps {
        update<ScriptBuildStep>(0) {
            id = "RUNNER_1461"
            clearConditions()
            scriptContent = """
                #!/bin/bash
                set -e -x
                
                # Required for docker
                mkdir -p ~/.ssh/
                touch ~/.ssh/config
                cat << EOT >> ~/.ssh/config
                Host github.com
                    StrictHostKeyChecking no
                    UserKnownHostsFile /dev/null
                EOT
                
                node -v
                npm -v
                npm whoami
                
                chmod 644 ~/.ssh/config
                
                # GitHub and NPM authorization
                git config user.email "%github.com.builduser.email%"
                git config user.name "%github.com.builduser.name%"
                
                echo "//registry.npmjs.org/:_authToken=%npmjs.com.auth.key%" > ~/.npmrc
                
                if [ -n "${'$'}(git status --porcelain)" ]; then
                  git status
                  echo "Your git status is not clean. Aborting.";
                  exit 1;
                fi
                
                chown -R root:root . # See https://github.com/npm/cli/issues/4589
                mkdir node_modules
                npm install
                npm run build
                
                if [ ! -d "./dist" ]
                then
                    echo "Directory ./dist does NOT exists. Build failed." >>/dev/stderr
                    exit 333
                fi
                
                # Reset possibly changed lock to avoid "git status is not clear" error
                git checkout package.json package-lock.json
                npm run release-ci -- %lerna.publish.options%
                
                cat package.json
                
                function publishBuildNumber {
                    local VERSION=${'$'}(node -p 'require("./package.json").version')
                    echo "##teamcity[buildNumber '${'$'}VERSION']"
                }
                
                publishBuildNumber
                
                #chmod 777 ~/.ssh/config
            """.trimIndent()
        }
    }
}
