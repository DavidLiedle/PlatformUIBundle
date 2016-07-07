/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('ez-locationviewversionstabview', function (Y) {
    "use strict";
    /**
     * Provides the Location View Versions Tab view class.
     *
     * @module ez-locationviewversionstabview
     */
    Y.namespace('eZ');

    var events = {
        '.ez-create-draft-from-archived-button': {
            'tap': '_createDraftFromArchivedVersion'
        },
        '.ez-archived-version-checkbox': {
            'change': '_enableCreateDraftFromArchivedVersionButton'
        },
        '.ez-delete-draft-button': {
            'tap': '_deleteDraft'
        },
        '.ez-draft-version-checkbox': {
            'change': '_enableCreateDeleteDraftButton'
        },
    };

    /**
     * The Location View View Versions tab class.
     *
     * @namespace eZ
     * @class LocationViewVersionsTabView
     * @constructor
     * @extends eZ.LocationViewTabView
     */
    Y.eZ.LocationViewVersionsTabView = Y.Base.create('locationViewVersionsTabView', Y.eZ.LocationViewTabView, [Y.eZ.AsynchronousView], {
        initializer: function () {
            this.events = Y.merge(this.events, events);
            this._fireMethod = this._fireLoadVersions;
            this._watchAttribute = 'versions';
        },

        render: function () {
            var container = this.get('container'),
                versions = this.get('versions'),
                archived = [],
                draft = [],
                published = [];

            if (versions) {
                archived = this._prepareVersionsForDisplay(versions.ARCHIVED);
                draft = this._prepareVersionsForDisplay(versions.DRAFT);
                published = this._prepareVersionsForDisplay(versions.PUBLISHED);
            }

            container.setHTML(this.template({
                "archivedVersions": archived.items,
                "publishedVersions": published.items,
                "draftVersions": draft.items,
                "hasArchived": archived.hasItems,
                "hasPublished": published.hasItems,
                "hasDraft": draft.hasItems,
                "loadingError": this.get('loadingError'),
            }));

            return this;
        },

        /**
         * Prepares a list of versionInfo to be displayed
         *
         * @method _prepareVersionsForDisplay
         * @protected
         * @param versions {Array} of eZ.VersionInfo
         * @return {Object} of Displayable versions struct:
         *              struct.items: {Array} of JSONified versionInfo
         *              struct.hasItems: true is struct has items
         */
        _prepareVersionsForDisplay: function (versions) {
            var versionsToDisplay = {
                items : [],
                hasItems : false,
            };

            if (versions) {
                versions.forEach(function (version) {
                    versionsToDisplay.hasItems = true;
                    versionsToDisplay.items.push(version.toJSON());
                });
            }

            return versionsToDisplay;
        },

        /**
         * Fire the `loadVersions` event to retrieve the versions
         *
         * @method _fireLoadVersions
         * @protected
         */
        _fireLoadVersions: function () {
            /**
             * Fired when versions are about to be loaded
             *
             * @event loadVersions
             */
            this.fire('loadVersions', {content: this.get('content')});
        },

        /**
         * Enables the `Create Draft form archived version` button if the selection is right
         *
         * @method _enableCreateDraftFromArchivedVersionButton
         * @protected
         */
        _enableCreateDraftFromArchivedVersionButton: function () {
            var c = this.get('container'),
                checked = c.all('.ez-archived-version-checkbox:checked'),
                button = c.one('.ez-create-draft-from-archived-button');

            if (checked.size() === 1) {
                button.set('disabled', false);
            } else {
                button.set('disabled', true);
            }
        },

        /**
         * Enables the `Delete selected Draft('s')` button if the selection is right
         *
         * @method _enableCreateDeleteDraftButton
         * @protected
         */
        _enableCreateDeleteDraftButton: function () {
            var c = this.get('container'),
                checked = c.all('.ez-draft-version-checkbox:checked'),
                button = c.one('.ez-delete-draft-button');

            if (checked.size() >= 1) {
                button.set('disabled', false);
            } else {
                button.set('disabled', true);
            }
        },

        /**
         * Creates a draft from an archived version
         *
         * @method _createDraftFromArchivedVersion
         * @protected
         */
        _createDraftFromArchivedVersion: function () {
            var c = this.get('container'),
                versions = Y.Array.reject(this.get('versions').ARCHIVED, function (version) {
                    var checkbox = c.one('.ez-archived-version-checkbox[data-version-id="' + version.get('id') + '"]');

                    if (checkbox && checkbox.get('checked')) {
                        return false;
                    }
                    return true;
                });

            if (versions.length === 1) {
                this._disableVersionsCheckboxes();

                /**
                 * Fired when the user clicks on the Create draft from archived version button
                 *
                 * @event createDraft
                 * @param {eZ.Content} content
                 *        {String} versionNo of the archived version. Ex: 42
                 *
                 */
                this.fire('createDraft', {
                    content: this.get('content'),
                    versionNo: versions[0].get('versionNo'),
                });
            }
        },

        /**
         * Returns the selected draft as VersionInfo
         *
         * @method _getSelectedDrafts
         * @protected
         * @return {Array} of eZ.VersionInfo
         */
        _getSelectedDrafts: function () {
            var c = this.get('container');

            return Y.Array.reject(this.get('versions').DRAFT, function (version) {
                var checkbox = c.one(
                    '.ez-draft-version-checkbox[data-version-id="' + version.get('id') + '"]'
                );

                if (checkbox && checkbox.get('checked')) {
                    return false;
                }
                return true;
            });
        },

        /**
         * Deletes one or several drafts
         *
         * @method _deleteDraft
         * @protected
         */
        _deleteDraft: function () {
            var versions = this._getSelectedDrafts();

            if (versions.length > 0) {
                this._disableVersionsCheckboxes();

                /**
                 * Fired when the user clicks on the Delete draft button
                 *
                 * @event deleteVersionDraft
                 * @param {Array} of eZ.VersionInfo
                 *        {Function} afterDeleteVersionsCallback
                 *
                 */
                this.fire('deleteVersionDraft', {
                    versions: versions,
                    afterDeleteVersionsCallback: Y.bind(this._afterDeleteVersionsCallback, this)
                });
            }
        },

        /**
         * Callback function called after removing version(s).
         *
         * @method _afterDeleteVersionsCallback
         * @protected
         * @param {Boolean} versionsRemoved if TRUE the view is reloaded, if FALSE it just enables checkboxes
         */
        _afterDeleteVersionsCallback: function (versionsRemoved) {
            if (versionsRemoved) {
                this._refresh();
            }
            else {
                this._enableVersionsCheckboxes();
            }
        },

        /**
         * Refreshes the tab. It fires `loadVersions` event.
         *
         * @method _refresh
         * @protected
         */
        _refresh: function () {
            this._fireLoadVersions();
        },

        /**
         * Disables all checkboxes on archived version list preventing from making use of them.
         *
         * @method _disableVersionsCheckboxes
         * @private
         */
        _disableVersionsCheckboxes: function () {
            this.get('container').all('.ez-version-checkbox').set('disabled', true);
        },

        /**
         * Enables checkboxes on version list.
         *
         * @method _enableVersionsCheckboxes
         * @private
         */
        _enableVersionsCheckboxes: function () {
            this.get('container').all('.ez-version-checkbox').set('disabled', false);
        }

    }, {
        ATTRS: {
            /**
             * The title of the tab
             *
             * @attribute title
             * @type {String}
             * @default "Versions"
             * @readOnly
             */
            title: {
                value: "Versions",
                readOnly: true,
            },

            /**
             * The identifier of the tab
             *
             * @attribute identifier
             * @type {String}
             * @default "versions"
             * @readOnly
             */
            identifier: {
                value: "versions",
                readOnly: true,
            },

            /**
             * List of the current content versions sorted by status.
             * Each status name is a properties of the versions object.
             *
             * @attribute versions
             * @type {Object}
             * @default {}
             */
            versions: {
                value: {},
            },

            /**
             * The content being displayed
             *
             * @attribute content
             * @type {eZ.Content}
             * @writeOnce
             */
            content: {
                writeOnce: 'initOnly',
            },

            /**
             * The config
             *
             * @attribute config
             * @type mixed
             * @writeOnce
             */
            config: {
                writeOnce: "initOnly",
            },
        }
    });
});
