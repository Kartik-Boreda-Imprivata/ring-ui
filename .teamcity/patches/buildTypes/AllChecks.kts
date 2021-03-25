package patches.buildTypes

import jetbrains.buildServer.configs.kotlin.v2018_2.*
import jetbrains.buildServer.configs.kotlin.v2018_2.triggers.VcsTrigger
import jetbrains.buildServer.configs.kotlin.v2018_2.triggers.vcs
import jetbrains.buildServer.configs.kotlin.v2018_2.ui.*

/*
This patch script was generated by TeamCity on settings change in UI.
To apply the patch, change the buildType with id = 'AllChecks'
accordingly, and delete the patch script.
*/
changeBuildType(RelativeId("AllChecks")) {
    triggers {
        val trigger1 = find<VcsTrigger> {
            vcs {
                quietPeriodMode = VcsTrigger.QuietPeriodMode.USE_DEFAULT
                triggerRules = "-:user=npmjs-buildserver:**"
            }
        }
        trigger1.apply {
            quietPeriodMode = VcsTrigger.QuietPeriodMode.DO_NOT_USE
        }
    }
}