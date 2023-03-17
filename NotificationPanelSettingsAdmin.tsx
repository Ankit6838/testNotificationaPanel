import _ from 'lodash';
import React, { FC, useEffect, useState } from 'react';
import {
    useNotificationPanelSettingsReducer,
    NotificationPanelSettingsAdminContext
} from './notificationPanelSettingsReducer';
import { NotificationPanelSettingsMenu } from './NotificationPanelSettingsMenu';
import { NotificationPanelSettingsCategoryOrder } from './NotificationPanelSettingsCategoryOrder';
import './NotificationPanelSettingsAdmin.less';
import { NotificationPanelSettingsGroupSelector } from './NotificationPanelSettingsGroupSelector';
import {
    HxgnNotification,
    HxgnNotificationType
} from '../../../Core/Components/CommonUI/HxGN/HxgnNotification/HxgnNotification';
import { HxgnButton } from '../../../Core/Components/CommonUI/HxGN/HxgnButton';

export interface INotificationPanelSettingsAdminProps {
    $state;
}

export const NotificationPanelSettingsAdmin: FC<INotificationPanelSettingsAdminProps> = props => {
    const reducer = useNotificationPanelSettingsReducer();
    const { $state } = props;
    const { state, strings, getSettings, dismissNotification, clearChanges, saveSettings } =
        reducer;
    const { selectedGroupId, showSaveNotification, errorMsg, hasChanges, canGrpSelected } = state;
    const [onlyGroupSettings, setOnlyGroupSettings] = useState(false);

    const [showDialog, canShowDialog] = useState(false);
    const [restrictCreateNewGroup, setRestrictCreateNewGroup] = useState(false);

    useEffect(() => {
        getSettings(onlyGroupSettings);
        setOnlyGroupSettings(true);
        if (hasChanges) {
            (restrictCreateNewGroup || !canGrpSelected) ? canShowDialog(true) : canShowDialog(false);
        }
        else canShowDialog(false);
    }, [selectedGroupId, canGrpSelected, restrictCreateNewGroup]);

    /** Handler for Create New Group button. Navigates to Group management view and opens new group area */
    const createNewGroup = () => {
        if (hasChanges) {
            setRestrictCreateNewGroup(true);
            return;
        }
        const createGroupURL = 'userGroupManagementView?select=group&id=CreateNew';
        let url: string = createGroupURL;
        let params: any;

        if (_.includes(createGroupURL, '?')) {
            const parts = createGroupURL.split('?');
            url = parts[0];
            params = {};
            const queryParams = parts[1].split('&');
            queryParams.forEach(qp => {
                const qpParts = qp.split('=');
                params[qpParts[0]] = qpParts[1];
            });
        }

        $state.go(url, params);
    };
    reducer.createNewGroup = createNewGroup;

    if (!strings) {
        return null;
    }

    return (
        <NotificationPanelSettingsAdminContext.Provider value={reducer}>
            <div className="admin-notification-settings flex-row">
                <HxgnNotification
                    showNotification={showSaveNotification}
                    notificationType={
                        !_.isEmpty(errorMsg)
                            ? HxgnNotificationType.error
                            : HxgnNotificationType.success
                    }
                    title={
                        !_.isEmpty(errorMsg)
                            ? (((reducer?.state?.groups).length > 0) &&
                                (reducer.state.groups).filter(group => group.id === selectedGroupId)[0]?.name?.startsWith('Default'))
                                ? "Cannot Modify Default Groups"
                                : strings.NOTIFICATION_CONFIG_SAVE_FAILED
                            : strings.NOTIFICATION_CONFIG_SAVE_SUCCESS
                    }
                    dismiss={() => dismissNotification()}
                />
                <div>
                    {showDialog && (
                        <div className="modal-confirm-backdrop backdrop" style={{ opacity: 1 }}>
                            <div className="modal-confirm dispatch-confirm flex-row flex-justify-center flex-align-start">
                                <div className="modal-confirm-pose-group" style={{ opacity: 1 }}>
                                    <div className="modal-confirm-dialog dispatch-confirm-dialog flex-col flex-justify-center flex-align-center">
                                        <div className="prompt-wrapper flex-grow flex-row flex-align-center flex-justify-center">
                                            {"You have unsaved changes. Do you want to save the changes?"}
                                        </div>
                                        <div className="btn-container flex-row flex-align-center flex-justify-end">
                                            <HxgnButton
                                                display={strings['CANCEL']}
                                                onClick={() => {
                                                    clearChanges();
                                                    setRestrictCreateNewGroup(false);
                                                }}
                                            />
                                            <HxgnButton
                                                primary
                                                className="save-btn"
                                                display={strings['SAVE']}
                                                onClick={() => {
                                                    saveSettings();
                                                    setRestrictCreateNewGroup(false);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <NotificationPanelSettingsGroupSelector></NotificationPanelSettingsGroupSelector>
                    <NotificationPanelSettingsCategoryOrder></NotificationPanelSettingsCategoryOrder>
                </div>
                <div className="admin-notification-settings-right">
                    <div className="notification-menu-header">
                        <h4>{strings['NOTIFICATION_DISPLAY_SETTINGS']}</h4>
                        <div>{strings['NOTIFICATION_AUTO_DISPLAY_DEFAULT']}</div>
                    </div>
                    <NotificationPanelSettingsMenu />
                    <div className="save-btn-group flex-row pull-right">
                        <HxgnButton
                            display={strings['CANCEL']}
                            onClick={clearChanges}
                            disabled={!hasChanges}
                        />
                        <HxgnButton
                            primary
                            className="save-btn"
                            display={strings['SAVE']}
                            onClick={saveSettings}
                            disabled={!hasChanges || (reducer?.state?.groups).filter(
                                group => group.id === selectedGroupId)[0]?.name?.startsWith('Default ')}
                        />
                    </div>
                </div>
            </div>
        </NotificationPanelSettingsAdminContext.Provider>
    );
};
