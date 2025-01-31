export default `<div class="shortcuts-hint">

  <div class="shortcuts-hint__search-input-wrapper">
    <rg-input
      ng-attr-placeholder="{{hintPopupCtrl.searchPlaceholder}}"
      ng-model="hintPopupCtrl.searchText"
    ></rg-input>
    <rg-icon
      class="shortcuts-hint__search-icon"
      glyph="{{hintPopupCtrl.searchIcon}}"
    ></rg-icon>
  </div>

  <div class="shortcuts-hint__columns">
    <div class="shortcuts-hint__table">
      <div ng-repeat="mode in hintPopupCtrl.modes"
        class="shortcuts-hint__shortcut-block">

        <div class="shortcuts-hint__table-title" ng-if="mode.title">
          <div></div>
          <div class="shortcuts-hint__shortcuts-title">{{hintPopupCtrl.getTitle(mode.title)}}</div>
        </div>

        <div ng-repeat="shortcut in mode.shortcuts | shortcutSearch:hintPopupCtrl.searchText"
          class="shortcuts-hint__table-row">
          <div class="shortcuts-hint__shortcut-cell">
            <div class="shortcuts-hint__shortcut"
              ng-if="hintPopupCtrl.isArray(shortcut.key)"
              ng-repeat="key in shortcut.key track by $index">
              {{key | shortcutKeySymbol}}
            </div>
            <span class="shortcuts-hint__shortcut"
              ng-if="!hintPopupCtrl.isArray(shortcut.key)">{{shortcut.key | shortcutKeySymbol}}</span>
          </div>
          <div class="shortcuts-hint__hint">
            <span ng-repeat="title in shortcut.titles">
              {{hintPopupCtrl.getTitle(title)}}
              <br ng-if="!$last">
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div rg-template="hintPopupCtrl.tailTemplate"></div>

</div>`;
