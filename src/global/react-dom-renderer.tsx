import React, {Component} from 'react';
import PropTypes from 'prop-types';

export interface RendererProps {
  className?: string | undefined
  nodes: readonly Node[]
}

export default class Renderer extends Component<RendererProps> {
  static propTypes = {
    className: PropTypes.string,
    nodes: PropTypes.array
  };

  componentDidMount() {
    const {nodes} = this.props;
    if (!this.node || !nodes || !nodes.length) {
      return;
    }
    const fragment = document.createDocumentFragment();
    nodes.forEach(nodeToRender => fragment.appendChild(nodeToRender));

    this.node.appendChild(fragment);
  }

  node?: HTMLElement | null;
  nodeRef = (node: HTMLElement | null) => {
    this.node = node;
  };

  render() {
    const {className} = this.props;
    return (
      <div
        className={className}
        ref={this.nodeRef}
      />
    );
  }
}
