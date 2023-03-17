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
    const { selectedGroupId, showSaveNotification, errorMsg, hasChanges } = state;
    const [onlyGroupSettings, setOnlyGroupSettings] = useState(false);

    useEffect(() => {
        getSettings(onlyGroupSettings);
        setOnlyGroupSettings(true);
    }, [selectedGroupId]);

    /** Handler for Create New Group button. Navigates to Group management view and opens new group area */
    const createNewGroup = () => {
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
                            ? strings.NOTIFICATION_CONFIG_SAVE_FAILED
                            : strings.NOTIFICATION_CONFIG_SAVE_SUCCESS
                    }
                    dismiss={() => dismissNotification()}
                />
                <div>
                    <NotificationPanelSettingsGroupSelector />
                    <NotificationPanelSettingsCategoryOrder />
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
                            disabled={!hasChanges}
                        />
                    </div>
                </div>
            </div>
        </NotificationPanelSettingsAdminContext.Provider>
    );
};
