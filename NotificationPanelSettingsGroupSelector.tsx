import React, { FC, useContext } from 'react';
import { HxgnButton } from '../../../Core/Components/CommonUI/HxGN/HxgnButton';
import { HxgnSelect } from '../../../Core/Components/CommonUI/HxGN/HxgnSelect';
import { NotificationPanelSettingsAdminContext } from './notificationPanelSettingsReducer';

export const NotificationPanelSettingsGroupSelector: FC = () => {
    const { state, strings, setSelectedGroup, createNewGroup } = useContext(
        NotificationPanelSettingsAdminContext
    );

    const { groups, selectedGroupId, hasChanges } = state;

    return (
        <div className="group-select-area">
            <h4>{strings['NOTIFICATION_PANEL_SETTINGS_GROUPS']}</h4>
            <div className="flex-row">
                <div className="group-selector">
                    <HxgnSelect
                        loading={!groups.length}
                        options={groups?.sort((a, b) => a.name.localeCompare(b.name))}
                        value={selectedGroupId}
                        onChange={hasChanges ? createNewGroup : setSelectedGroup}
                        valueKey="id"
                        labelKey="name"
                        clearable={false}
                    />
                </div>
                <HxgnButton
                    className="new-group-btn"
                    display={strings['NOTIFICATION_CONFIG_CREATE_GROUP_BTN']}
                    onClick={createNewGroup}
                />
            </div>
        </div>
    );
};
