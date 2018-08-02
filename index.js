var tcp = require('../../tcp');
var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

instance.prototype.updateConfig = function(config) {
	var self = this;

	self.config = config;
	self.init_tcp();
};

instance.prototype.init = function() {
	var self = this;

	debug = self.debug;
	log = self.log;

	self.status(self.STATE_UNKNOWN);

	self.init_tcp();
};

instance.prototype.init_tcp = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	if (self.config.host) {
		self.socket = new tcp(self.config.host, 4998);

		self.socket.on('status_change', function (status, message) {
			self.status(status, message);
		});

		self.socket.on('error', function (err) {
			debug("Network error", err);
			self.log('error',"Network error: " + err.message);
		});
	}
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Device IP',
			width: 12,
			regex: self.REGEX_IP
		},
		{
			type:  'text',
			id:    'info',
			width: 12,
			label: 'Information',
			value: 'This module controls an itac IP2CC device by <a href="https://www.globalcache.com/products/itach/ip2ccspecs/" target="_new">Global Cache</a>.'
		}
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
	}

	debug("destroy", self.id);;
};


instance.prototype.actions = function(system) {
	var self = this;
	self.system.emit('instance_actions', self.id, {
		'ccOneOn':    { label: 'Contact Closure 1 On' },
		'ccTwoOn':    { label: 'Contact Closure 2 On' },
		'ccThreeOn':  { label: 'Contact Closure 3 On' },
		'ccOneOff':   { label: 'Contact Closure 1 Off' },
		'ccTwoOff':   { label: 'Contact Closure 2 Off' },
		'ccThreeOff': { label: 'Contact Closure 3 Off' },
	});
}

instance.prototype.action = function(action) {
	var self = this;
	var cmd  = 'setstate,1:';
	var opt  = action.options;

	switch (action.action) {

		case 'ccOneOn':
			cmd += '1,1';
			break;

		case 'ccTwoOn':
			cmd += '2,1';
			break;

		case 'ccThreeOn':
			cmd += '3,1';
			break;

		case 'ccOneOff':
			cmd += '1,0';
			break;

		case 'ccTwoOff':
			cmd += '2,0';
			break;

		case 'ccThreeOff':
			cmd += '3,0';
			break;

	}

	if (cmd !== undefined) {

		debug('sending tcp', cmd, "to", self.config.host);

		if (self.socket !== undefined && self.socket.connected) {
			self.socket.send(cmd + "\r\n");
		} else {
			debug('Socket not connected :(');
		}

	}

	debug('action():', action);


};

instance.module_info = {
	label: 'Global Cache - iTach IP2CC',
	id: 'gc-itac-cc',
	version: '0.0.1'
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;
