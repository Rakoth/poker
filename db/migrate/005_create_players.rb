class CreatePlayers < ActiveRecord::Migration
  def self.up
    create_table :players do |t|
      t.integer :sit
      t.integer :stack
      t.integer :for_call
      t.string :state # :active, :allin, :pass, :away
      t.string :hand
      t.datetime :action_time
      t.datetime :control_action_time
      t.integer :action
      t.references :user
      t.references :game

      t.timestamps
    end
  end

  def self.down
    drop_table :players
  end
end
