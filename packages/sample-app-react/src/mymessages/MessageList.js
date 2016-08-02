import React, {Component, PropTypes} from 'react';

import MessageTable from './components/MessageTable';

/**
 * This component renders a list of messages using the `MessageTable` component
 */
class MessageList extends Component {
	render () {
		let {folder, messages} = this.props.resolves;
		return (
			<div className="messagelist">
				<div className="messages">
					<MessageTable columns={folder.columns} messages={messages} />
				</div>
			</div>
		);
	}
}

export default MessageList;