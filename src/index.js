'use strict';

const TIMEOUT = 30000;
const _       = require('lodash');
const unirest = require('unirest');
const debug   = require('debug')('sabnzbd');

/**
 * @param   {String} priority_name       paused, low, normal, high, forced
 * @returns {Number}
 */
const getPriorityFromName = function (priority_name) {
    // If a number was passed, just send it back
    if (!isNaN(priority_name)) {
        return priority_name;
    }

    // Otherwise
    switch (priority_name) {
        case 'paused':
            return -2;
            break;
        case 'low':
            return -1;
            break;
        case 'normal':
            return 0;
            break;
        case 'high':
            return 1;
            break;
        case 'forced':
        case 'force':
            return 2;
            break;
        default:
            // Default Priority (of category)
            return -100;
    }
};

module.exports = function (url, api_key) {

    if (url.indexOf('/sabnzbd/api') === -1) {
        url = url.replace(/\/?$/, '/sabnzbd/api');
    }

    const SABnzbd = {
        /**
         * @param   {String}  command
         * @param   {Object}  [args]
         * @returns {Promise}
         */
        cmd: function (command, args) {
            let query = _.assignIn({}, {
                mode:   command,
                apikey: api_key,
                output: 'json'
            }, _.omitBy(args, function (val) {
                return _.isUndefined(val) || _.isNull(val);
            }) || {});

            debug('Query:', query);

            return new Promise((resolve, reject) => {
                unirest.post(url)
                    .headers({
                        'Accept':       'application/json',
                        'Content-Type': 'application/json'
                    })
                    .query(query)
                    .timeout(TIMEOUT)
                    .end(function (response) {
                        if (typeof response.error !== 'undefined' && response.error) {
                            reject(new Error(response.error));
                        } else {
                            if (typeof response.headers['content-type'] !== 'undefined' && response.headers['content-type'].indexOf('application/json') === -1) {
                                reject(new Error('Response was not in JSON format'));
                            } else {
                                resolve(response.body);
                            }
                        }
                    });
            });
        },

        /**
         * @returns {Promise}
         */
        version: function () {
            return SABnzbd.cmd('version')
                .then((result) => {
                    if (typeof result.version !== 'undefined') {
                        return result.version;
                    } else {
                        return result;
                    }
                });
        },

        /**
         * @param {Integer} [start]
         * @param {Integer} [limit]
         * @param {String}  [search]
         * @returns {Promise}
         */
        queue: function (start, limit, search) {
            return SABnzbd.cmd('queue', {
                start:  start,
                limit:  limit,
                search: search
            })
                .then((result) => {
                    if (typeof result.queue !== 'undefined') {
                        return result.queue;
                    } else {
                        return result;
                    }
                });
        },

        /**
         * @param   {Integer}  [minutes]   If not set or undefined, will pause indefinitely
         * @returns {Promise}
         */
        pauseQueue: function (minutes) {
            let mode = 'pause';
            let args = {};

            if (minutes) {
                mode = 'config';
                args = {
                    name:  'set_pause',
                    value: minutes
                };
            }

            return SABnzbd.cmd(mode, args)
                .then((result) => {
                    if (typeof result.status !== 'undefined') {
                        return result.status;
                    } else {
                        return result;
                    }
                });
        },

        /**
         * @returns {Promise}
         */
        resumeQueue: function () {
            return SABnzbd.cmd('resume')
                .then((result) => {
                    if (typeof result.status !== 'undefined') {
                        return result.status;
                    } else {
                        return result;
                    }
                });
        },

        /**
         * @param   {String}  nzo_id
         * @returns {Promise}
         */
        pauseJob: function (nzo_id) {
            return SABnzbd.cmd('queue', {
                name:  'pause',
                value: nzo_id
            })
                .then((result) => {
                    if (typeof result.status !== 'undefined') {
                        return result.status;
                    } else {
                        return result;
                    }
                });
        },

        /**
         * @param   {String}  nzo_id
         * @returns {Promise}
         */
        resumeJob: function (nzo_id) {
            return SABnzbd.cmd('queue', {
                name:  'resume',
                value: nzo_id
            })
                .then((result) => {
                    if (typeof result.status !== 'undefined') {
                        return result.status;
                    } else {
                        return result;
                    }
                });
        },

        /**
         * @param   {Array|String}  nzo_ids   Array of nzo_id's or a comma separated string of nzo_id's
         * @param   {Boolean}       [delete_files]
         * @returns {Promise}
         */
        deleteJobs: function (nzo_ids, delete_files) {
            return SABnzbd.cmd('queue', {
                name:      'delete',
                value:     (typeof nzo_ids !== 'string' ? nzo_ids.join(',') : nzo_ids),
                del_files: delete_files ? 1 : undefined
            })
                .then((result) => {
                    if (typeof result.status !== 'undefined') {
                        return result.status;
                    } else {
                        return result;
                    }
                });
        },

        /**
         * @param   {Boolean} [delete_files]
         * @returns {Promise}
         */
        deleteAllJobs: function (delete_files) {
            return SABnzbd.cmd('queue', {
                name:      'delete',
                value:     'all',
                del_files: delete_files ? 1 : undefined
            })
                .then((result) => {
                    if (typeof result.status !== 'undefined') {
                        return result.status;
                    } else {
                        return result;
                    }
                });
        },

        /**
         * @param   {String} [search]
         * @param   {Boolean} [delete_files]
         * @returns {Promise}
         */
        purgeQueue: function (search, delete_files) {
            return SABnzbd.cmd('queue', {
                name:      'purge',
                search:    search,
                del_files: delete_files ? 1 : undefined
            })
                .then((result) => {
                    if (typeof result.status !== 'undefined') {
                        return result.status;
                    } else {
                        return result;
                    }
                });
        },

        /**
         * Job's can be switched by providing 2 nzo_id, `nzo_id_1` is the item you want to move, `nzo_id_2` is the name of
         * the job where you want to put `nzo_id_1` one above, shifting job `nzo_id_1` down.
         *
         * You can also move `nzo_id_1` to a specific location in the queue, where 0 is the top of the queue, by specifying `nzo_id_2` as the queue position number
         *
         * @param   {String}         nzo_id_1
         * @param   {String|Integer} nzo_id_2
         * @returns {Promise}
         */
        moveJob: function (nzo_id_1, nzo_id_2) {
            return SABnzbd.cmd('switch', {
                value:  nzo_id_1,
                value2: nzo_id_2
            });
        },

        /**
         * @param   {String}  nzo_id
         * @param   {String}  category
         * @returns {Promise}
         */
        changeJobCategory: function (nzo_id, category) {
            return SABnzbd.cmd('change_cat', {
                value:  nzo_id,
                value2: category
            });
        },

        /**
         * List of available scripts can be retrieved from getScripts()
         *
         * @param   {String}  nzo_id
         * @param   {String}  script
         * @returns {Promise}
         */
        changeJobScript: function (nzo_id, script) {
            return SABnzbd.cmd('change_script', {
                value:  nzo_id,
                value2: script
            });
        },

        /**
         * @param   {String}         nzo_id
         * @param   {String|Number}  priority     Can be a name or an integer as used by official api. Try these: `paused`, `low`, `normal`, `high`, `forced`
         * @returns {Promise}
         */
        changeJobPriority: function (nzo_id, priority) {
            return SABnzbd.cmd('queue', {
                name:     'priority',
                value:    nzo_id,
                priority: getPriorityFromName(priority)
            });
        },

        /**
         * @param   {String}         nzo_id
         * @param   {Number}         post_processing  Post-processing options: -1 = Default (of category), 0 = None, 1 = +Repair, 2 = +Repair/Unpack, 3 = +Repair/Unpack/Delete
         * @returns {Promise}
         */
        changeJobPostProcessing: function (nzo_id, post_processing) {
            return SABnzbd.cmd('change_opts', {
                value:  nzo_id,
                value2: post_processing
            });
        },

        /**
         * @param   {String}  nzo_id
         * @returns {Promise}
         */
        getJobFiles: function (nzo_id) {
            return SABnzbd.cmd('get_files', {
                value: nzo_id
            })
                .then((result) => {
                    if (typeof result.files !== 'undefined') {
                        return result.files;
                    } else {
                        return result;
                    }
                });
        },

        /**
         * @param   {String}  nzo_id
         * @param   {String}  nzf_id
         * @returns {Promise}
         */
        removeJobFile: function (nzo_id, nzf_id) {
            return SABnzbd.cmd('queue', {
                name:   'delete_nzf',
                value:  nzo_id,
                value2: nzf_id
            });
        },

        /**
         * @param   {*}  limit       Can be an integer from 1 to 100 which equates to the percentage of the maximum set in Sab,
         *                           or it can be a strict speed like "400K" or "1M"
         * @returns {Promise}
         */
        speedLimit: function (limit) {
            return SABnzbd.cmd('config', {
                name:  'speedlimit',
                value: limit
            })
                .then((result) => {
                    if (typeof result.status !== 'undefined') {
                        return result.status;
                    } else {
                        return result;
                    }
                });
        },

        /**
         * @param   {String}  action   One of: `hibernate_pc`, `standby_pc`, `shutdown_program` or Script: prefix the name of the script with `script_`, for example `script_test.py`
         * @returns {Promise}
         */
        onQueueComplete: function (action) {
            return SABnzbd.cmd('change_complete_action', {
                value: action
            })
                .then((result) => {
                    if (typeof result.status !== 'undefined') {
                        return result.status;
                    } else {
                        return result;
                    }
                });
        },

        /**
         * @param   {String}  field       One of: `avg_age`, `name`, `size`
         * @param   {String}  [direction] One of:  `asc`, `desc` with `asc` being default
         * @returns {Promise}
         */
        sortQueue: function (field, direction) {
            return SABnzbd.cmd('queue', {
                name: 'sort',
                sort: field,
                dir:  direction || 'asc'
            })
                .then((result) => {
                    if (typeof result.status !== 'undefined') {
                        return result.status;
                    } else {
                        return result;
                    }
                });
        },

        /**
         * @param   {String}         url
         * @param   {String}         [nzbname]          Optional name for the NZB download
         * @param   {String}         [category]         Category Name
         * @param   {String|Number}  [priority]         Can be a name or an integer as used by official api. Try these: `paused`, `low`, `normal`, `high`, `forced`
         * @param   {String}         [script]           Script to be assigned, Default will use the script assigned to the category. List of available scripts can be retrieved from `getScripts`
         * @param   {Number}         [post_processing]  Post-processing options: -1 = Default (of category), 0 = None, 1 = +Repair, 2 = +Repair/Unpack, 3 = +Repair/Unpack/Delete
         * @returns {Promise}
         */
        addByUrl: function (url, nzbname, category, priority, script, post_processing) {
            return SABnzbd.cmd('addurl', {
                name:     url,
                nzbname:  nzbname,
                cat:      category,
                priority: getPriorityFromName(priority),
                script:   script,
                pp:       post_processing
            })
                .then((result) => {
                    if (typeof result.nzo_ids !== 'undefined') {
                        return result.nzo_ids;
                    } else if (typeof result.status !== 'undefined') {
                        return result.status;
                    } else {
                        return result;
                    }
                });
        },

        /**
         * @param   {String}         local_location
         * @param   {String}         [nzbname]          Optional name for the NZB download
         * @param   {String}         [category]         Category Name
         * @param   {String|Number}  [priority]         Can be a name or an integer as used by official api. Try these: `paused`, `low`, `normal`, `high`, `forced`
         * @param   {String}         [script]           Script to be assigned, Default will use the script assigned to the category. List of available scripts can be retrieved from `getScripts`
         * @param   {Number}         [post_processing]  Post-processing options: -1 = Default (of category), 0 = None, 1 = +Repair, 2 = +Repair/Unpack, 3 = +Repair/Unpack/Delete
         * @returns {Promise}
         */
        addByLocation: function (local_location, nzbname, category, priority, script, post_processing) {
            return SABnzbd.cmd('addlocalfile', {
                name:     local_location,
                nzbname:  nzbname,
                cat:      category,
                priority: getPriorityFromName(priority),
                script:   script,
                pp:       post_processing
            })
                .then((result) => {
                    if (typeof result.nzo_ids !== 'undefined') {
                        return result.nzo_ids;
                    } else if (typeof result.status !== 'undefined') {
                        return result.status;
                    } else {
                        return result;
                    }
                });
        },

        /**
         * @param   {Integer}  [start]
         * @param   {Integer}  [limit]
         * @param   {String}   [category]
         * @param   {String}   [search]
         * @param   {Boolean}  [failed_only]
         * @returns {Promise}
         */
        history: function (start, limit, category, search, failed_only) {
            return SABnzbd.cmd('history', {
                start:       start,
                limit:       limit,
                category:    category,
                search:      search,
                failed_only: failed_only ? 1 : 0
            });
        },

        /**
         * @returns {Promise}
         */
        retryAllHistory: function () {
            return SABnzbd.cmd('retry_all');
        },

        /**
         * @param   {Array|String}  [nzo_ids]        'all', 'failed', nzo_id or array of nzo_id's
         * @param   {Boolean}       [delete_files]
         * @returns {Promise}
         */
        deleteHistory: function (nzo_ids, delete_files) {
            return SABnzbd.cmd('history', {
                name:      'delete',
                value:     (nzo_ids ? (typeof nzo_ids !== 'string' ? nzo_ids.join(',') : nzo_ids) : 'all'),
                del_files: delete_files ? 1 : 0
            });
        }

    };

    return SABnzbd;
};
