package patches.buildTypes

import jetbrains.buildServer.configs.kotlin.v2018_2.*
import jetbrains.buildServer.configs.kotlin.v2018_2.buildSteps.ScriptBuildStep
import jetbrains.buildServer.configs.kotlin.v2018_2.buildSteps.script
import jetbrains.buildServer.configs.kotlin.v2018_2.ui.*

/*
This patch script was generated by TeamCity on settings change in UI.
To apply the patch, change the buildType with id = 'A11yAudit'
accordingly, and delete the patch script.
*/
changeBuildType(RelativeId("A11yAudit")) {
    expectSteps {
        script {
            name = "Run audit"
            scriptContent = """
                #!/bin/bash
                set -e -x
                
                node -v
                npm -v
                
                chown -R root:root . # See https://github.com/npm/cli/issues/4589
                mkdir node_modules
                
                npm install
                npm run a11y-audit-ci
            """.trimIndent()
            dockerImage = "satantime/puppeteer-node:18.12"
        }
    }
    steps {
        update<ScriptBuildStep>(0) {
            clearConditions()
            scriptContent = """
                #!/bin/bash
                set -e -x
                
                node -v
                npm -v
                
                chown -R root:root . # See https://github.com/npm/cli/issues/4589
                mkdir -p node_modules
                
                npm install
                # Workaround for not always installed chromium https://github.com/puppeteer/puppeteer/issues/9533#issuecomment-1386653636
                node node_modules/puppeteer/install.js
                
                npm run a11y-audit-ci
            """.trimIndent()
        }
    }
}
