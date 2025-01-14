package patches.buildTypes

import jetbrains.buildServer.configs.kotlin.v2018_2.*
import jetbrains.buildServer.configs.kotlin.v2018_2.ui.*

/*
This patch script was generated by TeamCity on settings change in UI.
To apply the patch, change the buildType with id = 'UnpublishSpecificVersion'
accordingly, and delete the patch script.
*/
changeBuildType(RelativeId("UnpublishSpecificVersion")) {
    requirements {
        remove {
            contains("system.agent.name", "ubuntu")
        }
        add {
            contains("docker.server.osType", "linux")
        }
    }
}
