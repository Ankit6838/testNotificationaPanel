import _ from 'lodash';
import { createContext, useEffect, useReducer, useRef } from 'react';
import { IStrings } from '../../../Core/Entities/Interfaces/Utility/IStrings';
import {
    NotificationPanelSettings,
    NotificationPanelSort
} from '../../../Core/Entities/NotificationPanelSettings';
import { useStrings } from '../../../Core/Hooks/useStrings';
import { UserGroupDefinition } from '../../../Core/MessagesTs/MessageDefinitions';
import { getOnCallConfig, putOnCallConfig } from '../../../Core/Services/NonAngular/Config';
import { getAllUserGroups } from '../../../Core/Services/NonAngular/GroupService';
import { DuplicateNotification } from '../../../Core/Services/NonAngular/NotificationService';

export interface INotificationPanelSettingsAdminState {
    groups: UserGroupDefinition.V2_0_0.UserGroupDefinition[];
    selectedGroupId: number;
    hasChanges: boolean;
    groupSettings: NotificationPanelSettings;
    siteSettings: NotificationPanelSettings;
    editedSettings: NotificationPanelSettings;
    showSaveNotification: boolean;
    errorMsg: string;
}

export interface INotificationPanelSettingsAdminContextProps {
    state: INotificationPanelSettingsAdminState;
    strings: IStrings;
    getSettings: (groupSettingsOnly: boolean) => Promise<void>;
    saveSettings: () => void;
    dismissNotification: () => void;
    clearChanges: () => void;
    setSelectedGroup: (group: UserGroupDefinition.V2_0_0.UserGroupDefinition) => void;
    setEditedSettings: (updatedSettings: NotificationPanelSettings) => void;
    toggleAutoRemoveAfterClosed: () => void;
    setUnitStatusShowTime: (newValue: boolean) => void;
    setPendingEventsShowTime: (newValue: boolean) => void;
    setDuplicateNotificationProcessing: (newValue: DuplicateNotification) => void;
    toggleShowCategories: () => void;
    setSortOrder: (newValue: NotificationPanelSort) => void;
    setCategoryRanksEnabled: (newEdits: NotificationPanelSettings) => void;
    setNumPerCategory: (newValue: number, showAll?: boolean) => void;
    toggleUseDefault: () => void;
    toggleEnableAnimations: () => void;
    toggleUseFlagged: () => void;
    toggleUseArchive: () => void;
    createNewGroup: () => void;
}

export enum NotificationPanelSettingsAction {
    SetGroups,
    SetSiteSettings,
    SetGroupSettings,
    SetEditedSettings,
    SetSelectedGroup,
    ToggleUseDefault,
    ToggleShowCategories,
    Save,
    Clear,
    HideNotification,
    ShowError
}

export const notificationPanelSettingsReducer = (
    currentState: INotificationPanelSettingsAdminState,
    action: {
        type: NotificationPanelSettingsAction;
        payload?: Partial<INotificationPanelSettingsAdminState>;
    }
): INotificationPanelSettingsAdminState => {
    const { type, payload } = action;
    const { selectedGroupId, groupSettings, siteSettings, editedSettings } = currentState;

    switch (type) {
        case NotificationPanelSettingsAction.SetGroups:
            return {
                ...currentState,
                groups: payload.groups
            };
        case NotificationPanelSettingsAction.SetSiteSettings:
            return {
                ...currentState,
                siteSettings: _.assign(_.clone(siteSettings), payload.siteSettings)
            };
        case NotificationPanelSettingsAction.SetGroupSettings:
            if (selectedGroupId === -1) {
                payload.groupSettings = _.cloneDeep(siteSettings);
            } else if (!payload.groupSettings || payload.groupSettings.useDefault) {
                payload.groupSettings = _.cloneDeep(siteSettings);
                payload.groupSettings.useDefault = true;
            } else {
                payload.groupSettings.useDefault = false;
            }
            const newGroupSettings = _.assign(_.clone(groupSettings), payload.groupSettings);
            return {
                ...currentState,
                groupSettings: newGroupSettings,
                editedSettings: _.assign(_.clone(editedSettings), newGroupSettings),
                hasChanges: false
            };
        case NotificationPanelSettingsAction.SetEditedSettings: {
            const newSettings = {
                ..._.assign(_.cloneDeep(editedSettings), _.cloneDeep(payload.editedSettings)),
                useDefault: false
            };
            return {
                ...currentState,
                editedSettings: newSettings,
                hasChanges: !_.isEqual(JSON.stringify(newSettings), JSON.stringify(groupSettings))
            };
        }
        case NotificationPanelSettingsAction.SetSelectedGroup:
            return {
                ...currentState,
                selectedGroupId: payload.selectedGroupId
            };
        case NotificationPanelSettingsAction.ToggleUseDefault: {
            if (selectedGroupId === -1 && !editedSettings.useDefault) {
                const defaultSettings = {
                    ..._.assign(_.cloneDeep(editedSettings), new NotificationPanelSettings()),
                    useDefault: true
                };
                return {
                    ...currentState,
                    editedSettings: defaultSettings,
                    hasChanges: !_.isEqual(
                        JSON.stringify(groupSettings),
                        JSON.stringify(defaultSettings)
                    )
                };
            }
            if (!editedSettings.useDefault) {
                const defaultSettings = {
                    ..._.assign(_.cloneDeep(editedSettings), _.cloneDeep(siteSettings)),
                    useDefault: true
                };
                return {
                    ...currentState,
                    editedSettings: defaultSettings,
                    hasChanges: !_.isEqual(
                        JSON.stringify(groupSettings),
                        JSON.stringify(defaultSettings)
                    )
                };
            }
            const newSettings = {
                ...editedSettings,
                useDefault: false
            };
            return {
                ...currentState,
                editedSettings: newSettings,
                hasChanges: !_.isEqual(JSON.stringify(groupSettings), JSON.stringify(newSettings))
            };
        }
        case NotificationPanelSettingsAction.ToggleShowCategories: {
            const updatedShowCategories: boolean = !editedSettings.showCategories;
            let updatedSortSelection: NotificationPanelSort = editedSettings.sortOrder;

            if (!updatedShowCategories) {
                updatedSortSelection = NotificationPanelSort.PriorityAscending;
            } else {
                updatedSortSelection = NotificationPanelSort.Categories;
            }

            const newSettings = {
                ...editedSettings,
                showCategories: updatedShowCategories,
                sortOrder: updatedSortSelection,
                useDefault: false
            };

            return {
                ...currentState,
                editedSettings: newSettings,
                hasChanges: !_.isEqual(JSON.stringify(groupSettings), JSON.stringify(newSettings))
            };
        }
        case NotificationPanelSettingsAction.Clear: {
            const originalSettings = _.assign(_.clone(editedSettings), _.clone(groupSettings));

            return {
                ...currentState,
                hasChanges: false,
                editedSettings: originalSettings
            };
        }
        case NotificationPanelSettingsAction.Save:
            return {
                ...currentState,
                hasChanges: false,
                groupSettings: _.assign(_.clone(groupSettings), editedSettings),
                siteSettings:
                    selectedGroupId === -1
                        ? _.assign(_.clone(siteSettings), editedSettings)
                        : siteSettings,
                showSaveNotification: true
            };
        case NotificationPanelSettingsAction.HideNotification:
            return {
                ...currentState,
                showSaveNotification: false,
                errorMsg: ''
            };
        case NotificationPanelSettingsAction.ShowError:
            return {
                ...currentState,
                showSaveNotification: true,
                errorMsg: payload.errorMsg
            };
        default:
            return currentState;
    }
};

export const useNotificationPanelSettingsReducer =
    (): INotificationPanelSettingsAdminContextProps => {
        const NOTIFICATION_PANEL_SETTINGS_ITEM_TYPE = 'NotificationPanelSettings';
        const NOTIFICATION_PANEL_SETTINGS_SUB_TYPE = 'NotificationPanelSettings';
        const CACHE_PATTERN = `${NOTIFICATION_PANEL_SETTINGS_ITEM_TYPE}`;
        const stringKeys = [
            'Second_Abbreviation',
            'Hour_Abbreviation',
            'Minute_Abbreviation',
            'Unit-NotificationType',
            'Event-NotificationType',
            'Message-NotificationType',
            'System-NotificationType',
            'Notification_Options',
            'Notifications_Show_General',
            'Notifications_Show_Event',
            'NOTIFICATION_VIEW_FULL',
            'SHOW_HIDE_DETAILS',
            'Close',
            'NOTIFICATION_DISPLAY_DGROUP',
            'NOTIFICATION_DISPLAY_UNIT',
            'NOTIFICATION_DISPLAY_EMPLOYEE',
            'NOTIFICATION_VIEW_EVENT',
            'ARCHIVE_NOTIFICATION',
            'ARCHIVE_ALL_NOTIFICATIONS',
            'DELETE_NOTIFICATION',
            'DELETE_ALL_NOTIFICATIONS',
            'DISMISS_NOTIFICATION',
            'DISMISS_ALL_NOTIFICATIONS',
            'NOTIFICATION_AREA_TITLE',
            'RECOMMENDED_UNITS',
            'SEE_ALL',
            'SA_VIEW_DETAILS',

            'NOTIFICATION_CONFIG_FLAGGED_CATEGORY',
            'INFORMER_NOTIFICATION_CONFIG_CATEGORY',
            'BROADCAST_NOTIFICATION_CONFIG_CATEGORY',
            'NOTIFICATION_CONFIG_ALERTS_CATEGORY',
            'NOTIFICATION_CONFIG_RECOMMENDED_UNITS',
            'NOTIFICATION_CONFIG_TASK_ALERTS_CATEGORY',
            'NOTIFICATION_CONFIG_MSG_CATEGORY',
            'NOTIFICATION_CONFIG_UNIT_STATUS_CATEGORY',
            'NOTIFICATION_CONFIG_SYSTEM_CATEGORY',
            'NOTIFICATION_CONFIG_EVENT_CREATE_CATEGORY',
            'NOTIFICATION_CONFIG_EVENT_UPDATE_CATEGORY',
            'NOTIFICATION_CONFIG_CONTACT_CREATE_CATEGORY',
            'NOTIFICATION_CONFIG_CONTACT_UPDATE_CATEGORY',
            'NOTIFICATION_CONFIG_ARCHIVE_CATEGORY',
            'SMART_ADVISOR_NOTIFICATION_CONFIG_CATEGORY',
            'GEO_FENCE_NOTIFICATION_CONFIG_CATEGORY',
            'NOTIFICATION_CONFIG_OTHER_CATEGORY',

            'NOTIFICATION_PANEL_SETTINGS',
            'NOTIFICATION_PANEL_SETTINGS_ENABLE_FLAGGED',
            'NOTIFICATION_PANEL_SETTINGS_MOVE_ACKNOWLEDGED',
            'NOTIFICATION_PANEL_SETTINGS_AUTO_REMOVE',
            'NOTIFICATION_PANEL_SETTINGS_ENABLE_CATEGORIES',
            'NOTIFICATION_PANEL_SETTINGS_UNIT_STATUS',
            'NOTIFICATION_PANEL_SETTINGS_PENDING_EVENTS',
            'NOTIFICATION_PANEL_SETTINGS_SHOW_TIME',
            'NOTIFICATION_PANEL_SETTINGS_SHOW_TIME_REMAINING',
            'NOTIFICATION_PANEL_SETTINGS_CATEGORY_ORDER',
            'NOTIFICATION_PANEL_SETTINGS_CATEGORY_ORDER_INSTRUCTIONS',
            'NOTIFICATION_PANEL_SETTINGS_CATEGORY_ORDER_ENABLE_INSTRUCTIONS',
            'NOTIFICATION_PANEL_SETTINGS_CATEGORY_ORDER_FOOTNOTE',
            'NOTIFICATION_PANEL_SETTINGS_DUPLICATE_NOTIFICATION_PROCESS',
            'NOTIFICATION_PANEL_SETTINGS_DUPLICATE_NOTIFICATION_PROCESS_MSG',
            'NOTIFICATION_PANEL_SETTINGS_SHOW_ALL_NOTIFICATIONS',
            'NOTIFICATION_PANEL_SETTINGS_SHOW_SOME_NOTIFICATIONS',
            'NOTIFICATION_PANEL_SETTINGS_SHOW_ALL',
            'NOTIFICATION_PANEL_SETTINGS_SHOW_ALL_NOTIFICATIONS_MSG',
            'NOTIFICATION_PANEL_SETTINGS_DISPLAY_OLDEST_NOTIFICATIONS',
            'NOTIFICATION_PANEL_SETTINGS_DISPLAY_OLDEST',
            'NOTIFICATION_PANEL_SETTINGS_DISPLAY_OLDEST_NOTIFICATIONS_MSG',
            'NOTIFICATION_PANEL_SETTINGS_DISPLAY_NEWEST_NOTIFICATIONS',
            'NOTIFICATION_PANEL_SETTINGS_DISPLAY_NEWEST',
            'NOTIFICATION_PANEL_SETTINGS_DISPLAY_NEWEST_NOTIFICATIONS_MSG',
            'NOTIFICATION_PANEL_SETTINGS_USE_DEFAULT',
            'NOTIFICATION_PANEL_SETTINGS_NUM_PER_CATEGORY',
            'NOTIFICATION_PANEL_SETTINGS_ENABLE_ANIMATIONS',
            'NOTIFICATION_PANEL_SETTINGS_ENABLE_ANIMATIONS_MSG',

            'NOTIFICATION_PANEL_FILTER_SHOW_ALL',
            'NOTIFICATION_PANEL_FILTER_CUSTOM',
            'NOTIFICATION_PANEL_FILTER_P0',
            'NOTIFICATION_PANEL_FILTER_P1',
            'NOTIFICATION_PANEL_FILTER_P2',
            'NOTIFICATION_PANEL_FILTER_P3',
            'NOTIFICATION_PANEL_FILTER_PO',
            'NOTIFICATION_PANEL_CATEGORY_HEADER',
            'NOTIFICATION_PANEL_PRIORITY_HEADER',
            'NOTIFICATION_PANEL_FILTER_MESSAGE_ALL',
            'NOTIFICATION_PANEL_FILTER_MESSAGE_FILTERED',

            'NOTIFICATION_PANEL_SORT_CATEGORIES',
            'NOTIFICATION_PANEL_SORT_PRIORITY_ASC',
            'NOTIFICATION_PANEL_SORT_PRIORITY_DESC',
            'NOTIFICATION_PANEL_SORT_NEWEST',
            'NOTIFICATION_PANEL_SORT_OLDEST',
            'NOTIFICATION_PANEL_FILTER_OPTIONS',
            'NOTIFICATION_PANEL_SORT_OPTIONS',
            'DELETE_ALL_UI_NOTIFICATIONS',
            'CONFIRMATION_CANCEL',
            'CLEAR',
            'CANCEL',
            'SAVE',
            'NOTIFICATION_CONFIG_CREATE_GROUP_BTN',
            'NOTIFICATION_PANEL_SETTINGS_GROUPS',
            'NOTIFICATION_DISPLAY_SETTINGS',
            'NOTIFICATION_AUTO_DISPLAY_DEFAULT',
            'NOTIFICATION_CONFIG_SAVE_FAILED',
            'NOTIFICATION_CONFIG_SAVE_SUCCESS'
        ];
        const strings = useStrings(stringKeys);

        const [state, dispatch] = useReducer(notificationPanelSettingsReducer, {
            groups: [],
            selectedGroupId: -1,
            hasChanges: false,
            groupSettings: new NotificationPanelSettings(),
            siteSettings: new NotificationPanelSettings(),
            editedSettings: new NotificationPanelSettings(),
            showSaveNotification: false,
            errorMsg: ''
        });

        const { selectedGroupId, editedSettings, showSaveNotification } = state;

        const notificationTimeout = useRef(null);

        // Hide the save notification 5 seconds after it appears
        useEffect(() => {
            if (showSaveNotification) {
                notificationTimeout.current = setTimeout(() => {
                    dispatch({ type: NotificationPanelSettingsAction.HideNotification });
                }, 5000);
            } else {
                clearTimeout(notificationTimeout.current);
                notificationTimeout.current = null;
            }
        }, [showSaveNotification]);

        /**
         * Fetch the list of user groups
         */
        const getGroups = (): Promise<void> => {
            return getAllUserGroups().then(userGroups => {
                const defaultGroup = new UserGroupDefinition.V2_0_0.UserGroupDefinition();
                defaultGroup.id = -1;
                defaultGroup.name = 'Default';
                dispatch({
                    type: NotificationPanelSettingsAction.SetGroups,
                    payload: { groups: _.concat([defaultGroup], userGroups) }
                });
            });
        };

        /**
         * Fetch site level settings from OnCallConfiguration
         */
        const getSiteSettings = (): Promise<void> => {
            let configSettings: string = null;
            return getOnCallConfig(
                'site',
                NOTIFICATION_PANEL_SETTINGS_ITEM_TYPE,
                NOTIFICATION_PANEL_SETTINGS_SUB_TYPE,
                CACHE_PATTERN
            )
                .then(settings => {
                    if (!_.isEmpty(settings)) {
                        configSettings = settings;
                    }
                })
                .catch(reason => {
                    console.log(
                        'Notification Panel Settings failed to find saved site-level settings, using system default settings',
                        reason
                    );
                })
                .finally(() => {
                    if (_.isNil(configSettings) || JSON.parse(configSettings)?.useDefault) {
                        configSettings = JSON.stringify({
                            ...new NotificationPanelSettings(),
                            useDefault: true
                        });
                    }
                    dispatch({
                        type: NotificationPanelSettingsAction.SetSiteSettings,
                        payload: {
                            siteSettings: JSON.parse(configSettings)
                        }
                    });
                });
        };

        /**
         * Fetch the settings for the currently selected group from OnCallConfiguration
         */
        const getGroupSettings = (): Promise<void> => {
            let configSettings: string = null;
            return getOnCallConfig(
                'group',
                NOTIFICATION_PANEL_SETTINGS_ITEM_TYPE,
                NOTIFICATION_PANEL_SETTINGS_SUB_TYPE,
                CACHE_PATTERN,
                selectedGroupId
            )
                .then(settings => {
                    if (!_.isEmpty(settings)) {
                        configSettings = settings;
                    }
                })
                .catch(reason => {
                    console.log(
                        'Notification Panel Settings failed to find group-level settings, using site-level settings',
                        reason
                    );
                })
                .finally(() => {
                    dispatch({
                        type: NotificationPanelSettingsAction.SetGroupSettings,
                        payload: { groupSettings: JSON.parse(configSettings) }
                    });
                });
        };

        const getSettings = async (groupSettingsOnly: boolean): Promise<void> => {
            if (!groupSettingsOnly) {
                await getGroups();
                await getSiteSettings();
            }
            await getGroupSettings();
        };

        const saveSettings = (): void => {
            if (selectedGroupId === -1) {
                putOnCallConfig(
                    JSON.stringify(editedSettings),
                    'site',
                    NOTIFICATION_PANEL_SETTINGS_ITEM_TYPE,
                    NOTIFICATION_PANEL_SETTINGS_SUB_TYPE,
                    CACHE_PATTERN
                )
                    .then(() => {
                        console.log('Success!');
                        dispatch({ type: NotificationPanelSettingsAction.Save });
                    })
                    .catch(() => {
                        console.log('Failure!');
                        dispatch({
                            type: NotificationPanelSettingsAction.ShowError,
                            payload: { errorMsg: strings.NOTIFICATION_CONFIG_SAVE_FAILED }
                        });
                    });
            } else {
                putOnCallConfig(
                    JSON.stringify(editedSettings),
                    'group',
                    NOTIFICATION_PANEL_SETTINGS_ITEM_TYPE,
                    NOTIFICATION_PANEL_SETTINGS_SUB_TYPE,
                    CACHE_PATTERN,
                    selectedGroupId
                )
                    .then(() => {
                        console.log('Success!');
                        dispatch({ type: NotificationPanelSettingsAction.Save });
                    })
                    .catch(() => {
                        console.log('Failure!');
                        dispatch({
                            type: NotificationPanelSettingsAction.ShowError,
                            payload: { errorMsg: strings.NOTIFICATION_CONFIG_SAVE_FAILED }
                        });
                    });
            }
        };

        const dismissNotification = () => {
            dispatch({ type: NotificationPanelSettingsAction.HideNotification });
        };

        const clearChanges = (): void => dispatch({ type: NotificationPanelSettingsAction.Clear });

        /**
         * Sets the edited settings
         * @param updatedSettings The updated settings object
         */
        const setEditedSettings = (updatedSettings: NotificationPanelSettings): void =>
            dispatch({
                type: NotificationPanelSettingsAction.SetEditedSettings,
                payload: { editedSettings: updatedSettings }
            });

        /**
         * Sets the selected user group id
         * @param group The the newly selected group
         */
        const setSelectedGroup = (group: UserGroupDefinition.V2_0_0.UserGroupDefinition): void =>
            dispatch({
                type: NotificationPanelSettingsAction.SetSelectedGroup,
                payload: { selectedGroupId: group.id }
            });

        const toggleAutoRemoveAfterClosed = (): void =>
            dispatch({
                type: NotificationPanelSettingsAction.SetEditedSettings,
                payload: {
                    editedSettings: {
                        ...editedSettings,
                        autoRemoveAfterClosed: !editedSettings.autoRemoveAfterClosed
                    }
                }
            });

        const setUnitStatusShowTime = (newValue: boolean): void =>
            dispatch({
                type: NotificationPanelSettingsAction.SetEditedSettings,
                payload: {
                    editedSettings: {
                        ...editedSettings,
                        unitStatusShowTime: newValue
                    }
                }
            });

        const setPendingEventsShowTime = (newValue: boolean): void =>
            dispatch({
                type: NotificationPanelSettingsAction.SetEditedSettings,
                payload: {
                    editedSettings: {
                        ...editedSettings,
                        pendingEventsShowTime: newValue
                    }
                }
            });

        const setDuplicateNotificationProcessing = (newValue: DuplicateNotification): void =>
            dispatch({
                type: NotificationPanelSettingsAction.SetEditedSettings,
                payload: {
                    editedSettings: {
                        ...editedSettings,
                        duplicateNotificationProcessing: newValue
                    }
                }
            });

        const toggleShowCategories = (): void =>
            dispatch({ type: NotificationPanelSettingsAction.ToggleShowCategories });

        const setSortOrder = (newValue: NotificationPanelSort): void =>
            dispatch({
                type: NotificationPanelSettingsAction.SetEditedSettings,
                payload: {
                    editedSettings: {
                        ...editedSettings,
                        sortOrder: newValue
                    }
                }
            });

        const setCategoryRanksEnabled = (newEdits: NotificationPanelSettings): void =>
            setEditedSettings(newEdits);

        const setNumPerCategory = (newValue: number, showAll: boolean = false) => {
            if (showAll) {
                newValue = -1;
            } else if (!newValue || newValue < 1) {
                newValue = 1;
            }

            dispatch({
                type: NotificationPanelSettingsAction.SetEditedSettings,
                payload: {
                    editedSettings: {
                        ...editedSettings,
                        numPerCategory: newValue
                    }
                }
            });
        };

        const toggleUseDefault = (): void =>
            dispatch({ type: NotificationPanelSettingsAction.ToggleUseDefault });

        const toggleEnableAnimations = (): void => {
            dispatch({
                type: NotificationPanelSettingsAction.SetEditedSettings,
                payload: {
                    editedSettings: {
                        ...editedSettings,
                        enableAnimations: !editedSettings.enableAnimations
                    }
                }
            });
        };

        const toggleUseFlagged = (): void =>
            dispatch({
                type: NotificationPanelSettingsAction.SetEditedSettings,
                payload: {
                    editedSettings: {
                        ...editedSettings,
                        useFlagged: !editedSettings.useFlagged
                    }
                }
            });

        const toggleUseArchive = (): void =>
            dispatch({
                type: NotificationPanelSettingsAction.SetEditedSettings,
                payload: {
                    editedSettings: {
                        ...editedSettings,
                        useArchive: !editedSettings.useArchive
                    }
                }
            });

        return {
            state,
            strings,
            getSettings,
            saveSettings,
            dismissNotification,
            clearChanges,
            setSelectedGroup,
            setEditedSettings,
            toggleAutoRemoveAfterClosed,
            setUnitStatusShowTime,
            setPendingEventsShowTime,
            setDuplicateNotificationProcessing,
            toggleShowCategories,
            setSortOrder,
            setCategoryRanksEnabled,
            setNumPerCategory,
            toggleUseDefault,
            toggleEnableAnimations,
            toggleUseFlagged,
            toggleUseArchive,
            createNewGroup: null
        };
    };

export const NotificationPanelSettingsAdminContext =
    createContext<INotificationPanelSettingsAdminContextProps>(null);
