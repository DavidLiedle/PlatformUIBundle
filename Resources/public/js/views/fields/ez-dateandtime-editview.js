/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('ez-dateandtime-editview', function (Y) {
    "use strict";
    /**
     * Provides the field edit view for the date and time fields
     *
     * @module ez-dateandtime-editview
     */
    Y.namespace('eZ');

    var FIELDTYPE_IDENTIFIER = 'ezdatetime',
        NO_ERROR = 0,
        DATE_TIME_INVALID = 1,
        DATE_INVALID_TIME_REQUIRED = 2,
        DATE_INVALID = 3,
        TIME_INVALID_DATE_REQUIRED = 4,
        TIME_INVALID = 5,
        DATE_TIME_REQUIRED = 6,
        TIME_REQUIRED = 7,
        DATE_REQUIRED = 8,
        DATE_INVALID_TIME_MISSING = 9,
        TIME_INVALID_DATE_MISSING = 10,
        ERROR_MSG_DICTIONARY = {};

    /**
     * Date and time edit view
     *
     * @namespace eZ
     * @class DateAndTimeEditView
     * @constructor
     * @extends eZ.FieldEditView
     */
    Y.eZ.DateAndTimeEditView = Y.Base.create('dateAndTimeEditView', Y.eZ.FieldEditView, [], {
        events: {
            '.ez-dateandtime-date-input-ui input': {
                'blur': 'validate',
                'valuechange': 'validate',
            },
            '.ez-dateandtime-time-input-ui input': {
                'blur': 'validate',
                'valuechange': 'validate',
            }
        },

        initializer: function () {
            this._useStandardFieldDefinitionDescription = false;

            ERROR_MSG_DICTIONARY[NO_ERROR] = false;
            ERROR_MSG_DICTIONARY[DATE_TIME_INVALID] = Y.eZ.trans('date.and.time.not.valid', {}, 'fieldedit');
            ERROR_MSG_DICTIONARY[DATE_INVALID_TIME_REQUIRED] = Y.eZ.trans('date.not.valid.time.required', {}, 'fieldedit');
            ERROR_MSG_DICTIONARY[DATE_INVALID] = Y.eZ.trans('date.not.valid', {}, 'fieldedit');
            ERROR_MSG_DICTIONARY[TIME_INVALID_DATE_REQUIRED] = Y.eZ.trans('time.not.valid.date.required', {}, 'fieldedit');
            ERROR_MSG_DICTIONARY[TIME_INVALID] = Y.eZ.trans('time.not.valid', {}, 'fieldedit');
            ERROR_MSG_DICTIONARY[DATE_TIME_REQUIRED] = Y.eZ.trans('date.time.required', {}, 'fieldedit');
            ERROR_MSG_DICTIONARY[TIME_REQUIRED] = Y.eZ.trans('time.required', {}, 'fieldedit');
            ERROR_MSG_DICTIONARY[DATE_REQUIRED] = Y.eZ.trans('date.required', {}, 'fieldedit');
            ERROR_MSG_DICTIONARY[DATE_INVALID_TIME_MISSING] = Y.eZ.trans('date.not.valid.time.missing', {}, 'fieldedit');
            ERROR_MSG_DICTIONARY[TIME_INVALID_DATE_MISSING] = Y.eZ.trans('time.not.valid.date.missing', {}, 'fieldedit');
        },

        /**
         * Validates the current input of date and time field
         *
         * @method validate
         */
        validate: function () {
            var errorNumber = 0;

            if (this.get('fieldDefinition').isRequired) {
                errorNumber = this._getErrorNumberValidateRequired();
            } else {
                errorNumber = this._getErrorNumberValidateNotRequired();
            }
            this.set('errorStatus', ERROR_MSG_DICTIONARY[errorNumber]);
            this._set('validateError', errorNumber);

        },

        /**
         * Returns the error number for the validateRequired case
         *
         *
         * @protected
         * @method _getErrorNumberValidateRequired
         * @return
         */
        _getErrorNumberValidateRequired: function () {
            var dateValidity = this._getDateInputValidity(),
                timeValidity = this._getTimeInputValidity(),
                badInputDate = dateValidity.badInput,
                badInputTime = timeValidity.badInput,
                missingDate = (dateValidity.platformMissingDate && !timeValidity.platformMissingTime) ||
                    (dateValidity.platformMissingDate && timeValidity.badInput),
                missingTime = (timeValidity.platformMissingTime && ! dateValidity.platformMissingDate) ||
                    (timeValidity.platformMissingTime && dateValidity.badInput),
                requiredDate = dateValidity.valueMissing,
                requiredTime = timeValidity.valueMissing,
                errorNumber = 0;

            if(badInputTime || badInputDate) {
                if(badInputTime && badInputDate){
                    errorNumber = DATE_TIME_INVALID;
                } else if (badInputDate) {
                    if(missingTime) {
                        errorNumber = DATE_INVALID_TIME_REQUIRED;
                    } else {
                        errorNumber = DATE_INVALID;
                    }
                } else {
                    if (missingDate) {
                        errorNumber = TIME_INVALID_DATE_REQUIRED;
                    } else {
                        errorNumber = TIME_INVALID;
                    }
                }
            } else if (requiredDate || requiredTime) {
                if (requiredDate && requiredTime) {
                    errorNumber = DATE_TIME_REQUIRED;
                } else if (requiredTime) {
                    errorNumber = TIME_REQUIRED;

                } else {
                    errorNumber = DATE_REQUIRED;
                }
            }
            return errorNumber;
        },

        /**
         * Returns the error number for the validateNotRequired case
         *
         *
         * @protected
         * @method _getErrorNumberValidateNotRequired
         * @return
         */
        _getErrorNumberValidateNotRequired: function () {
            var dateValidity = this._getDateInputValidity(),
                timeValidity = this._getTimeInputValidity(),
                badInputDate = dateValidity.badInput,
                badInputTime = timeValidity.badInput,
                missingDate = (dateValidity.platformMissingDate && !timeValidity.platformMissingTime) ||
                    (dateValidity.platformMissingDate && timeValidity.badInput),
                missingTime = (timeValidity.platformMissingTime && ! dateValidity.platformMissingDate) ||
                    (timeValidity.platformMissingTime && dateValidity.badInput),
                errorNumber = 0;

            if(badInputTime || badInputDate) {
                if(badInputTime && badInputDate){
                    errorNumber = DATE_TIME_INVALID;
                } else if (badInputDate) {
                    if(missingTime) {
                        errorNumber = DATE_INVALID_TIME_MISSING;
                    } else {
                        errorNumber = DATE_INVALID;
                    }
                } else {
                    if (missingDate) {
                        errorNumber = TIME_INVALID_DATE_MISSING;
                    } else {
                        errorNumber = TIME_INVALID;
                    }
                }
            } else if (missingDate) {
                errorNumber = DATE_INVALID;
            } else if (missingTime) {
                errorNumber = TIME_INVALID;
            }
            return errorNumber;
        },

        /**
         * Defines the variables to import in the field edit template for date and time
         *
         * @protected
         * @method _variables
         * @return {Object} holding the variables for the template
         */
        _variables: function () {
            var def = this.get('fieldDefinition'),
                field = this.get('field'),
                date = '',
                time = '';

            if (!this._isFieldEmpty()) {
                date = Y.Date.format(new Date(field.fieldValue.timestamp * 1000));
                time = Y.Date.format(new Date(field.fieldValue.timestamp * 1000), {format: "%T"});
            }

            return {
                "isRequired": def.isRequired,
                "html5InputDate": date,
                "html5InputTime": time,
                "useSeconds": def.fieldSettings.useSeconds
            };
        },

        /**
         * Returns the date input node of the dateAndTime template
         *
         *
         * @protected
         * @method _getDateInputNode
         * @return {Y.Node}
         */
        _getDateInputNode: function () {
            return this.get('container').one('.ez-dateandtime-date-input-ui input');
        },

        /**
         * Returns the date input node
         * the date template
         *
         *
         * @protected
         * @method _getTimeInputNode
         * @return {Y.Node}
         */
        _getTimeInputNode: function () {
            return this.get('container').one('.ez-dateandtime-time-input-ui input');
        },

        /**
         * Returns the input validity state object for the input generated by
         * the date of the date and time template
         * Furthermore we added 'platformMissingDate' property to this object
         *
         * See https://developer.mozilla.org/en-US/docs/Web/API/ValidityState
         *
         * @protected
         * @method _getInputValidity
         * @return {ValidityState}
         */
        _getDateInputValidity: function () {
            var platformMissingDate = !this._getDateInputNode().get('valueAsNumber'),
                dateInputValidity = this._getDateInputNode().get('validity');

            dateInputValidity.platformMissingDate = platformMissingDate;

            return dateInputValidity;
        },

        /**
         * Returns the input validity state object for the input generated by
         * the time of the date and time template
         * Furthermore we added 'platformMissingTime' property to this object
         *
         * See https://developer.mozilla.org/en-US/docs/Web/API/ValidityState
         *
         * @protected
         * @method _getInputValidity
         * @return {ValidityState}
         */
        _getTimeInputValidity: function () {
            var platformMissingTime = !this._getTimeInputNode().get('valueAsNumber'),
                timeInputValidity = this._getTimeInputNode().get('validity');

            timeInputValidity.platformMissingTime = platformMissingTime;

            return timeInputValidity;
        },

        /**
         * Returns a timestamps in UTC
         *
         * @protected
         * @method _getUtcTimeStamp
         * @param {Number} localizedTimestamp in millisecond
         * @return {Number} Timestamp converted to UTC in millisecond
         */
        _getUtcTimeStamp: function (localizedTimestamp) {
            var tzOffset = new Date(localizedTimestamp).getTimezoneOffset() * 60000;
            return localizedTimestamp + tzOffset;
        },

        /**
         * Returns the currently filled date and time value
         *
         * @protected
         * @method _getFieldValue
         * @return {Object}
         */
        _getFieldValue: function () {
            var valueOfDateInput = this._getDateInputNode().get('value'),
                valueOfTimeInput = this._getTimeInputNode().get('value'),
                dateInputInSec = parseInt(Y.Date.format(Y.Date.parse(valueOfDateInput), {format:"%s"})),
                timeInputInSec = this._parseTime(valueOfTimeInput),
                utcTimeStamp,
                localizedTimeStamps;

            if (isNaN(dateInputInSec) || isNaN(timeInputInSec)) {
                return null;
            }

            localizedTimeStamps = dateInputInSec + timeInputInSec;
            utcTimeStamp = this._getUtcTimeStamp(localizedTimeStamps * 1000);

            return {timestamp: utcTimeStamp/1000};
        },

        /**
         * Returns the timestamp value of a given time string
         *
         * Note: this method should be refactored as part of EZP-23925
         *
         * @protected
         * @method _parseTime
         * @param timeStr time in 24h string format hh:mm:ss
         * @return {Number} Timestamp in seconds
         */
        _parseTime: function (timeStr) {
            var time = timeStr.split(":"),
                hours,
                minutes,
                seconds;

            if ( time.length >= 2 ) {
                hours = parseInt(time[0], 10)*3600;
                minutes = parseInt(time[1], 10)*60;
                seconds = 0;
                if ( time.length > 2 ) {
                    seconds = parseInt(time[2], 10);
                }
                time = hours + minutes + seconds;
                return time;
            }
            return null;
        },

        /**
         * Whether the field is empty or not
         *
         * @protected
         * @method _isFieldEmpty
         * @return {Boolean}
         */
        _isFieldEmpty: function () {
            var field = this.get('field');

            return (!field || !field.fieldValue || isNaN(field.fieldValue.timestamp));
        },
    },{
        ATTRS: {
            /**
             * The number of the validate error
             *
             * @attribute validateError
             * @readOnly
             */
            validateError: {
                readOnly: true,
                value: null
            }
        }
    });

    Y.eZ.FieldEditView.registerFieldEditView(FIELDTYPE_IDENTIFIER, Y.eZ.DateAndTimeEditView);
});
