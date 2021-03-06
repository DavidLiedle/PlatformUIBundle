/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('ez-float-editview', function (Y) {
    "use strict";
    /**
     * Provides the field edit view for the Float (ezfloat) fields
     *
     * @module ez-float-editview
     */
    Y.namespace('eZ');

    var FIELDTYPE_IDENTIFIER = 'ezfloat',
        FLOAT_PATTERN = "-?\\d*\\.?\\d+"; // WARNING: each backslash is doubled, because it is escaped on output otherwise

    /**
     * Float edit view
     *
     * @namespace eZ
     * @class FloatEditView
     * @constructor
     * @extends eZ.FieldEditView
     */
    Y.eZ.FloatEditView = Y.Base.create('floatEditView', Y.eZ.FieldEditView, [], {
        events: {
            '.ez-float-input-ui input': {
                'blur': 'validate',
                'valuechange': 'validate'
            }
        },

        /**
         * Validates the current input of Float
         *
         * @method validate
         */
        validate: function () {
            var validity,
                config = this._variables(),
                input = this.get('container').one('.ez-float-input-ui input'),
                inputValue = input.get('value');

            // Auto-correction value, if comma is present
            input.set('value', inputValue.replace(",", "."));

            validity = this._getInputValidity();

            if ( validity.valueMissing ) {
                this.set('errorStatus', Y.eZ.trans('this.field.is.required', {}, 'fieldedit'));
            // Float pattern validation
            } else if ( validity.patternMismatch ) {
                this.set(
                    'errorStatus',
                    Y.eZ.trans('invalid.float.value', {}, 'fieldedit')
                );
            // Range validation
            } else if ( config.maxFloatValue && inputValue > config.maxFloatValue ) {
                this.set(
                    'errorStatus',
                    Y.eZ.trans('float.value.should.be.less.than', config, 'fieldedit')
                );
            } else if ( config.minFloatValue && inputValue < config.minFloatValue ) {
                this.set(
                    'errorStatus',
                    Y.eZ.trans('float.value.should.be.more.than', config, 'fieldedit')
                );

            } else {
                this.set('errorStatus', false);
            }
        },

        /**
         * Defines the variables to be imported in the field edit template for
         * float
         *
         * @protected
         * @method _variables
         * @return {Object} containing isRequired, minFloatValue and
         * maxFloatValue entries
         */
        _variables: function () {
            var minFloatValue = false,
                maxFloatValue = false,
                def = this.get('fieldDefinition');

            if ( def.validatorConfiguration.FloatValueValidator.minFloatValue ) {
                minFloatValue = def.validatorConfiguration.FloatValueValidator.minFloatValue;
            }
            if ( def.validatorConfiguration.FloatValueValidator.maxFloatValue ) {
                maxFloatValue = def.validatorConfiguration.FloatValueValidator.maxFloatValue;
            }

            return {
                "isRequired": def.isRequired,
                "floatPattern": FLOAT_PATTERN,
                "minFloatValue": minFloatValue,
                "maxFloatValue": maxFloatValue
            };
        },

        /**
         * Returns the input validity state object for the input generated by
         * the Float template
         *
         * See https://developer.mozilla.org/en-US/docs/Web/API/ValidityState
         *
         * @protected
         * @method _getInputValidity
         * @return {ValidityState}
         */
        _getInputValidity: function () {
            return this.get('container').one('.ez-float-input-ui input').get('validity');
        },

        /**
         * Returns the currently filled float value
         *
         * @protected
         * @method _getFieldValue
         * @return Number
         */
        _getFieldValue: function () {
            return parseFloat(this.get('container').one('.ez-float-input-ui input').get('value'));
        }
    });

    Y.eZ.FieldEditView.registerFieldEditView(
        FIELDTYPE_IDENTIFIER, Y.eZ.FloatEditView
    );
});
