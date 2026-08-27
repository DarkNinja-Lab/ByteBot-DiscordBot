const {
    PermissionsBitField,
} = require('discord.js');

function hasAdministratorPermission(interaction) {
    return Boolean(
        interaction?.member?.permissions?.has(
            PermissionsBitField.Flags.Administrator
        )
    );
}

function hasModerationPermission(interaction) {
    return Boolean(
        interaction?.member?.permissions?.has(
            PermissionsBitField.Flags.ModerateMembers
        ) ||
        interaction?.member?.permissions?.has(
            PermissionsBitField.Flags.ManageRoles
        ) ||
        interaction?.member?.permissions?.has(
            PermissionsBitField.Flags.Administrator
        )
    );
}

function getPermissionError(permissionName = 'Administrator') {
    return {
        content: `❌ Du benötigst die Berechtigung **${permissionName}** für diese Aktion.`,
        ephemeral: true,
    };
}

function canManageRole(guild, role) {
    if (!guild || !role) {
        return false;
    }

    const botMember = guild.members.me;

    if (!botMember) {
        return false;
    }

    if (role.managed) {
        return false;
    }

    return role.position < botMember.roles.highest.position;
}

function getRoleManagementError(role) {
    if (!role) {
        return {
            content: '❌ Diese Rolle konnte nicht gefunden werden.',
            ephemeral: true,
        };
    }

    if (role.managed) {
        return {
            content:
                '❌ Diese Rolle wird von Discord oder einer Integration verwaltet und kann nicht vergeben werden.',
            ephemeral: true,
        };
    }

    return {
        content:
            '❌ Der Bot kann diese Rolle nicht verwalten. ' +
            'Die Bot-Rolle muss in den Servereinstellungen über der Zielrolle stehen.',
        ephemeral: true,
    };
}

async function fetchMember(guild, userId) {
    if (!guild || !userId) {
        return null;
    }

    return guild.members.fetch(userId).catch(() => null);
}

module.exports = {
    hasAdministratorPermission,
    hasModerationPermission,
    getPermissionError,
    canManageRole,
    getRoleManagementError,
    fetchMember,
};